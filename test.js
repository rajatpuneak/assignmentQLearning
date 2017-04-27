var selenium = require('selenium-webdriver'),
    By = selenium.By,
    until = selenium.until,
    chromedriver = require('chromedriver'),
    iedriver = require('iedriver'),
    firefox = require('geckodriver'),
    expect = require('chai').expect,
    assert = require('chai').assert,
    fs = require('fs-plus');

var argv = require('optimist').argv;

var browser = argv.browser;

var driver = new getDriverInstance(browser);

function getDriverInstance(browserName) {
    console.log('browserName : ', browserName);
    switch (browserName || '') {

        case 'firefox':
            {
                console.log('in WD firefox');
                driver = new selenium.Builder().withCapabilities({
                    browserName: 'firefox',
                    javascriptEnabled: true,
                    acceptSslCerts: true,
                    'webdriver.firefox.bin': firefox.path
                }).build();

            }
            break;

        case 'IE':
            {
                console.log('in WD IE');
                driver = new selenium.Builder().withCapabilities({
                    browserName: 'internet explorer',
                    javascriptEnabled: true,
                    acceptSslCerts: true,
                    path: iedriver.path
                }).build();
            }
            break;

        // default to chrome
        default:
            {
                console.log('in WD chrome');
                driver = new selenium.Builder().withCapabilities({
                    browserName: 'chrome',
                    javascriptEnabled: true,
                    acceptSslCerts: true,
                    chromeOptions: {
                        "args": ["start-maximized"]
                    },
                    path: chromedriver.path
                }).build();
            }
    };

    return driver;
}

function selectOption(selector, item) {
    var selectList, desiredOption;
    // console.log('item:', item);
    selectList = driver.findElement(selector);
    selectList.click();
    driver.sleep(500);
    return selectList.findElements(By.tagName('option'))
        .then(function findMatchingOption(options) {
            options.some(function (option) {
                option.getText().then(function doesOptionMatch(text) {
                    //console.log('text : ', text);
                    if (item === text) {
                        // console.log('Matched text : ', item, ' ', text);
                        desiredOption = option;
                        // return true;
                    }
                });
            });
        })
        .then(function clickOption() {
            if (desiredOption) {
                return desiredOption.click();
            }
        });
}

function test() {
    console.log('Executing on Quantra');
    return driver.get('https://quantra.quantinsti.com/courseList').then(function () {
        driver.wait(until.elementsLocated(By.css('.innerRightsec')), 10000, 'Page Didnot Load');
        driver.sleep(1500);
        driver.getTitle().then(function (pageTitle) {
            console.log('pageTitle :', pageTitle);
            expect(pageTitle).to.contain('Courses | Quantra by QuantInsti');
        });
        // driver.sleep(2000);
        driver.getCurrentUrl().then(function (pageUrl) {
            console.log('pageUrl :', pageUrl);
            expect(pageUrl).to.contain('https://quantra.quantinsti.com/courseList');
        });

        driver.executeScript('return window.scrollTo(400,400);');

        driver.wait(until.elementsLocated(By.css('label[for="paid"]')), 10000, 'Page Didnot Load');

        driver.findElement(By.css('label[for="paid"]')).click();

        driver.wait(until.elementsLocated(By.css('.slider-wrapper div[ng-if*="paid"]')), 10000, 'Price Slider Didnot Appear');

        driver.findElement(By.css('.slider-wrapper span.rz-pointer.rz-pointer-min')).then(function (sliderLeft) {
            driver.sleep(1000);
            driver.actions().mouseDown(sliderLeft).mouseMove({ x: 79, y: 0 }).mouseUp(sliderLeft).perform();
            driver.sleep(1500);
        });
        driver.findElement(By.css('#searchInHeader')).click();
        driver.findElement(By.css('.slider-wrapper span.rz-pointer.rz-pointer-max')).then(function (sliderRight) {
            driver.sleep(1000);
            driver.actions().mouseDown(sliderRight).mouseMove({ x: -154, y: 0 }).mouseUp(sliderRight).perform();
            driver.sleep(1000);
        });
        driver.executeScript('return window.scrollTo(40,40);');
        driver.sleep(1000);

        driver.findElement(By.css('#searchInHeader')).click();

        /**
         * Trading using options Sentiment Indicators is a free course so soes not appear in paid courses 
         * below code is commented as will fail on asserting for Assignent step4 mentioned course
         */
        // driver.findElement(By.css('#cbp-vm ul li')).then(function (course) {
        //     course.findElement(By.css('.cbp-vm-details h2.ng-binding')).getText().then(function (courseTitle) {
        //         expect(courseTitle).to.contain('Trading Using Options Sentiment Indicators');
        //     });
        // });

        driver.findElement(By.css('#cbp-vm ul li')).then(function (course) {
            course.findElement(By.css('.cbp-vm-details h2.ng-binding')).getText().then(function (courseTitle) {
                expect(courseTitle).to.contain('Python For Trading!');
            });
            course.findElement(By.css('.cbp-vm-add.ng-scope p span a.btn-enroll')).click().then(function (courseTitle) {

                driver.wait(until.elementsLocated(By.css('div.popup_panel')), 10000, 'Login popup didnot appear');
                driver.findElement(By.css('div.popup_panel')).then(function (loginPopup) {
                    loginPopup.findElement(By.css('input[name="email"]')).sendKeys('quantra+interview@quantinsti.com');
                    driver.sleep(1500);
                    loginPopup.findElement(By.css('input[name="password"]')).sendKeys('test@123', selenium.Key.ENTER);
                    driver.sleep(1500);
                });

                driver.wait(until.elementsLocated(By.css('form[name="paymentForm"]')), 10000, 'Payment page didnot load');
                driver.getCurrentUrl().then(function (pageUrl) {
                    console.log('Payment pageUrl :', pageUrl);
                    expect(pageUrl).to.contain('https://quantra.quantinsti.com/payment');
                });
                driver.findElement(By.css('form[name="paymentForm"]')).then(function (paymentForm) {
                    paymentForm.findElement(By.css('input[name="address"]')).sendKeys('Test Address');
                    paymentForm.findElement(By.css('input[name="city"]')).sendKeys('Test City');
                    paymentForm.findElement(By.css('input[name="postal_code"]')).sendKeys('123456');
                    // paymentForm.findElement(By.css('select[name="country"]')).click();
                    selectOption(By.css('form[name="paymentForm"] select[name="country"]'), 'India');
                    driver.sleep(500);
                    paymentForm.findElement(By.css('input[name="phone"]')).sendKeys('1234567890', selenium.Key.ENTER);
                    driver.sleep(1000);
                    driver.wait(until.elementsLocated(By.css('form[name="TransactionForm"]')), 10000, 'Transaction form did not appear');
                });
            });
        });

    });
    return true;
}
// driver.findElement(By.name('q')).sendKeys('webdriver');
// driver.findElement(By.name('btnG')).click();
// driver.wait(until.titleIs('webdriver - Google Search'), 1000);
test().then(function () {
    return driver.takeScreenshot().then(function (screenShot) {
        var screenshotFile = 'screenshot.png'
        fs.writeFile(screenshotFile, screenShot.replace(/^data:image\/png;base64,/, ''), 'base64', function (err) {
            if (err) throw err;
        });
        return driver.close().then(function () {
            console.log("\n\nEnd of Test Final Screenshot Available at : ", screenshotFile);
            return driver.quit();
        });
    });
});
