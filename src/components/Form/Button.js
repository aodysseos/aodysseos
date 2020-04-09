import React from 'react'
import styled, { css } from 'styled-components'

const StyledButton = styled.button`
	font-size: 1.38316rem;
	line-height: 1.1;
	font-weight: 500;
	min-width: 150px;
	height: 60px;
	color: ${({ theme }) => theme.secondary};
	background-color: ${({ theme }) => theme.buttonBorder};
	border: 3px solid;
	border-color: ${({ theme }) => theme.buttonBorder};
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }) => theme.primary};
		border-color: ${({ theme }) => theme.primary};
	}

	${(props) =>
		props.disabled &&
		css`
			cursor: not-allowed;
			background-color: ${({ theme }) => theme.primary};
			border-color: ${({ theme }) => theme.primary};
		`};
`

const Button = ({ type, name, disabled }) => (
	<StyledButton type={type} disabled={disabled}>
		{name}
	</StyledButton>
)

export default Button
