const https = require('https')
const querystring = require('querystring')
const AWS = require('aws-sdk')
const SES = new AWS.SES()
const personalEmail = process.env.RECEIVER
const websiteEmail = process.env.SENDER
const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY

const MESSAGE = {
	SUCCESS: "Thank you for getting in touch. I'll get back to you soon.",
	FAIL: 'Oops, something went wrong! Please, try again.',
	RECAPTCHA_SUCCESS: '',
	RECAPTCHA_FAIL: ''
}

const responseMessage = (message, success) => ({ statusCode: success ? 200 : 400, success, message })

const handleSendEmail = async (name, email, message) => {
	const htmlData = `
		<h1>Contact Form</h1>\n\n
		<h2>Email received:</h2>\n\n
		<ul>
			<li><strong>Name:</strong> ${name}</li>\n
			<li><strong>Email:</strong> ${email}</li>\n
			<li><strong>Message:</strong> ${message}</li>
		</ul>`
	const textData = `
		Contact form\n\n
		Email received:\n\n
		Name: ${name}\n
		Email: ${email}\n
		Message: ${message}`

	const params = {
		Source: websiteEmail,
		Destination: {
			ToAddresses: [ personalEmail ]
		},
		Message: {
			Body: {
				Html: {
					Charset: 'UTF-8',
					Data: htmlData
				},
				Text: {
					Charset: 'UTF-8',
					Data: textData
				}
			},
			Subject: {
				Charset: 'UTF-8',
				Data: `Message from ${email}`
			}
		}
	}

	return new Promise((resolve) => {
		SES.sendEmail(params, (err) => {
			const response = err ? responseMessage(MESSAGE.FAIL, false) : responseMessage(MESSAGE.SUCCESS, true)
			resolve(response)
		})
	})
}

const handleValidateRecaptchaToken = async (token) => {
	const postData = querystring.stringify({
		secret: recaptchaSecret,
		response: token
	})

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

	return new Promise((resolve) => {
		const req = https.request(options, (res) => {
			let reCaptchaResults
			res.on('data', (data) => {
				reCaptchaResults = JSON.parse(data)
			})
			res.on('end', () => {
				const { success } = reCaptchaResults
				if (success) {
					resolve(responseMessage(MESSAGE.RECAPTCHA_SUCCESS, true))
				} else {
					resolve(responseMessage(MESSAGE.RECAPTCHA_FAIL, false))
				}
			})
		})

		req.on('error', (e) => {
			console.log(`problem with request: ${e}`)
			resolve(responseMessage(MESSAGE.RECAPTCHA_FAIL, false))
		})

		req.write(postData)
		req.end()
	})
}

exports.handler = async (event) => {
	const name = event.name
	const email = event.email
	const message = event.message
	const token = event['g-recaptcha-response']

	let response

	try {
		const valitationResponse = await handleValidateRecaptchaToken(token)
		if (valitationResponse.success) {
			response = await handleSendEmail(name, email, message)
		} else {
			response = valitationResponse
		}
	} catch (error) {
		return error
	}

	return response
}
