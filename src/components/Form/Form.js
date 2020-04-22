import React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import styled from 'styled-components'
import * as Yup from 'yup'
import _get from 'lodash/get'

import { Formik, Form } from 'formik'

import Heading from '../Heading'
import InputField from './InputField'
import Button from './Button'

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
	padding-top: 4rem;
	max-width: 650px;
`

const ButtonsWrapper = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	position: relative;
	margin-top: 2rem;
`

const SubmitedMessage = styled.div`
	position: absolute;
	top: -30px;
	right: 0;
`

const ContactForm = () => {
	const [ isExpired, setIsExpired ] = React.useState(true)
	const [ submitedMessage, setSubmitedMessage ] = React.useState()
	const [ errors, setErrors ] = React.useState({})
	const recaptchaRef = React.createRef()

	const handleInputFieldClick = (e) => {
		if (submitedMessage) {
			setSubmitedMessage(null)
		}
	}

	const handleCaptchaChange = (token) => {
		if (!token) {
			setIsExpired(true)
		}
	}

	const validationSchema = Yup.object().shape({
		name: Yup.string().max(200, 'Wow, that is a long name! Better keep it short.').required('Required'),
		email: Yup.string().email('Invalid email').required('Required'),
		message: Yup.string().max(10000, 'Wow, that is a long message! Better keep it short.').required('Required')
	})

	const handleSubmit = async ({ values, setSubmitting, setErrors, setStatus, resetForm }) => {
		const recaptchaToken = recaptchaRef.current.getValue()
		const reqConfig = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				...values,
				'g-recaptcha-response': recaptchaToken
			})
		}

		if (!recaptchaToken && Object.keys(errors).length === 0) return

		try {
			await fetch(process.env.GATSBY_AWS_CONTACT_FORM_API, reqConfig)
				.then((response) => response.json())
				.then((result) => {
					const { success, message, errorMessage } = result
					if (success) {
						resetForm()
						setSubmitedMessage(message)
						setStatus(success)
					} else {
						setSubmitedMessage(errorMessage)
						setStatus({ success: false })
					}
					setSubmitting(false)
				})
				.catch((error) => {
					setErrors({ submit: _get(error, 'message') })
				})
		} catch (error) {
			setSubmitting(false)
			setStatus({ success: false })
			setErrors({ submit: 'Oops, something went wrong! Please, try again.' })
		}
	}

	React.useEffect(() => {
		recaptchaRef.current.reset()
		recaptchaRef.current.execute()
	}, [])

	return (
		<Formik
			initialValues={{
				name: '',
				email: '',
				message: ''
			}}
			validationSchema={validationSchema}
			onSubmit={(values, { setSubmitting, setErrors, setStatus, resetForm }) => {
				handleSubmit({ values, setSubmitting, setErrors, setStatus, resetForm })
				recaptchaRef.current.reset()
				recaptchaRef.current.execute()
			}}
		>
			{({ errors, handleSubmit, handleChange, isSubmitting, isValid, status, values }) => {
				return (
					<StyledForm>
						<InputField name="name" label="Name" type="text" errors={errors} onClick={handleInputFieldClick} />
						<InputField name="email" label="Email" type="email" errors={errors} onClick={handleInputFieldClick} />
						<InputField
							name="message"
							label="Message"
							type="text"
							component="textarea"
							rows="8"
							errors={errors}
							onClick={handleInputFieldClick}
						/>

						<ButtonsWrapper>
							{submitedMessage && (
								<SubmitedMessage>
									<Heading heading={'notify'} variant="primary">
										{submitedMessage}
									</Heading>
								</SubmitedMessage>
							)}
							<ReCAPTCHA
								ref={recaptchaRef}
								theme="light"
								badge="inline"
								render="explicit"
								size="invisible"
								sitekey={process.env.GATSBY_RECAPTCHA_SITE_KEY}
								onChange={handleCaptchaChange}
							/>
							<Button type="submit" name="Submit" disabled={!isValid} />
						</ButtonsWrapper>
					</StyledForm>
				)
			}}
		</Formik>
	)
}

export default ContactForm
