import React from 'react'
import styled from 'styled-components'
import { variant } from 'styled-system'

import theme from '../styles/theme'

const H1 = styled.h1(
	{
		color: `${({ theme }) => theme.primary}`
	},
	variant({
		variants: {
			primary: {
				fontWeight: 800,
				marginBottom: '0.5rem'
			},
			secondary: {
				fontWeight: 400
			}
		}
	})
)

const H2 = styled.h2(
	{
		color: '#767676'
	},
	variant({
		variants: {
			primary: {
				fontWeight: 300,
				fontSize: '24px',
				lineHeight: '32px',
				letterSpacing: '-1.33px'
			},
			secondary: {
				color: '#2B2B2B',
				fontWeight: 800,
				display: 'inline'
			}
		}
	})
)

const H3 = styled.h3(
	{
		color: '#767676'
	},
	variant({
		variants: {
			primary: {
				fontSize: '34px',
				color: '#2B2B2B',
				fontWeight: 800,
				display: 'inline'
			},
			secondary: {}
		}
	})
)

const H4 = styled.h4(
	{
		appearance: 'none',
		fontFamily: 'Montserrat'
	},
	variant({
		variants: {
			primary: {
				fontSize: '34px',
				fontWeight: 300,
				display: 'inline',
				letterSpacing: '-0.8px',
				color: '#767676'
			},
			secondary: {
				color: 'black',
				bg: 'secondary'
			}
		}
	})
)

const ErrorMessage = styled.span(
	{
		color: `#d50000`,
		fontFamily: 'Montserrat'
	},
	variant({
		variants: {
			primary: {
				fontSize: '14px',
				fontWeight: 300,
				display: 'inline',
				letterSpacing: '-0.8px'
			},
			secondary: {
				color: 'black',
				bg: 'secondary'
			}
		}
	})
)

const NotficationMessage = styled.span(
	{
		color: `#2B2B2B`,
		fontFamily: 'Montserrat'
	},
	variant({
		variants: {
			primary: {
				fontSize: '1rem',
				fontWeight: 400,
				display: 'inline',
				letterSpacing: '-0.8px'
			},
			secondary: {
				color: 'black',
				bg: 'secondary'
			}
		}
	})
)

const Heading = ({ heading, variant, children }) =>
	({
		1: <H1 variant={variant}>{children}</H1>,
		2: <H2 variant={variant}>{children}</H2>,
		3: <H3 variant={variant}>{children}</H3>,
		4: <H4 variant={variant}>{children}</H4>,
		error: <ErrorMessage variant={variant}>{children}</ErrorMessage>,
		notify: <NotficationMessage variant={variant}>{children}</NotficationMessage>
	}[heading] || <p>{children}</p>)

export default Heading
