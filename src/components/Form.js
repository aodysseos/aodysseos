import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

import { Formik, Field, Form } from 'formik'

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
	padding-top: 4rem;
	max-width: 650px;

  > input, textarea {
    border: 3px solid ${({ theme }) => theme.primary};
  }
`

const ContactForm = () => (
	<Formik
		initialValues={{
			email: '',
			message: ''
		}}
		onSubmit={async (values) => {
			alert(JSON.stringify(values, null, 2))
		}}
	>
		<StyledForm>
			<label htmlFor="email">Email</label>
			<Field name="email" type="email" />

			<label htmlFor="message">Message</label>
			<Field name="message" component="textarea" rows="8" />

			<button type="submit">Submit</button>
		</StyledForm>
	</Formik>
)

export default ContactForm
