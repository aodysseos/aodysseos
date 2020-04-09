import React from 'react'
import styled from 'styled-components'
import { Field } from 'formik'

import Heading from '../Heading'

const StyledField = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	> input,
	> textarea {
		font-size: 1.2rem;
		border: 3px solid ${({ theme }) => theme.primary};
		padding: .8rem;
	}
`

const ErrorMessage = styled.div`
	position: absolute;
	bottom: 0;
	right: 0;
`

const InputFields = ({ errors, type, name, label, component, rows, onClick }) => (
	<StyledField>
		<label htmlFor={name}>{label}</label>
		<Field name={name} type={type} component={component} rows={rows} onClick={onClick} />
		{errors[name] && (
			<ErrorMessage>
				<Heading heading={'error'} variant="primary">
					{errors[name]}
				</Heading>
			</ErrorMessage>
		)}
	</StyledField>
)

export default InputFields
