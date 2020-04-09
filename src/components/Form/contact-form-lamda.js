/* Code snippet from: https://seifi.org/aws/build-a-contact-form-in-gatsby-part-1-aws-lambda-simple-email-service-and-api-gateway.html
 * 1. Making http request: https://nodejs.org/api/http.html#http_http_request_options_callback 
 */

const https = require('https')
const querystring = require('querystring')
const aws = require('aws-sdk')
const ses = new aws.SES()

exports.handler = (event, context) => {
	const { name, email, message } = event

	const emailParams = {
		Source: process.env.SENDER,
		Destination: {
			ToAddresses: [ process.env.RECEIVER ]
		},
		Message: {
			Body: {
				Html: {
					Charset: 'UTF-8',
					Data: `<h1>Contact Form</h1>\n\n<h2>Email received:</h2>\n\n<ul><li><strong>Name:</strong> ${name}</li>\n<li><strong>Email:</strong> ${email}</li><li><strong>Message:</strong> ${message}</li>\n`
				},
				Text: {
					Data: `Contact form\n\nEmail received:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
					Charset: 'UTF-8'
				}
			},
			Subject: {
				Data: `Message from ${email}`,
				Charset: 'UTF-8'
			}
		}
	}

	const sendEmail = () => {
		ses.sendEmail(emailParams, (err) => {
			if (err) {
				context.fail({
					message: 'Oops, something went wrong! Please, try again.',
					success: false
				})
			} else {
				context.succeed({
					message: "Thank you for getting in touch. I'll get back to you soon.",
					success: true
				})
			}
		})
	}

	const postData = querystring.stringify({
		secret: process.env.RECAPTCHA_SECRET_KEY,
		response: event['g-recaptcha-response']
	})

	const handleRecaptchaData = (chunch) => {
		const { statusCode, headers, body, success } = JSON.parse(chunch)
		if (success) {
			sendEmail()
		} else {
			context.fail('Oh no! it looks like you are a robot. Please, try again once you are human.')
		}
	}

	const options = {
		hostname: 'www.google.com',
		port: 443,
		path: '/recaptcha/api/siteverify',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(postData)
		}
	}

	const req = https.request(options, (res) => {
		res.setEncoding('utf8')
		res.on('data', handleRecaptchaData)
		res.on('end', () => {
			console.log('No more data in response.')
		})
	})

	req.on('error', (e) => {
		console.error(`problem with request: ${e}`)
	})

	req.write(postData)
	req.end()
}
