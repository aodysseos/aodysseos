import React from 'react'
import styled from 'styled-components'
import { variant } from 'styled-system'

const P1 = styled.p(
	{
		fontFamily: ({ theme }) => theme.secondaryFontFamily,
		color: ({ theme }) => theme.primary
	},
	variant({
		variants: {
			primary: {
				fontSize: '1.1875rem',
				lineHeight: 1.9,
				fontWeight: 300
			},
			secondary: {
				fontWeight: 400
			}
		}
	})
)

const P2 = styled.p(
	{
		color: ({ theme }) => theme.primary
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
				fontWeight: 800,
				display: 'inline'
			}
		}
	})
)

const Paragraph = ({ paragraph, variant, children }) =>
	({
		1: <P1 variant={variant}>{children}</P1>,
		2: <P2 variant={variant}>{children}</P2>
	}[paragraph] || <p>{children}</p>)

export default Paragraph
