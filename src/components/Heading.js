import React from 'react'
import styled from 'styled-components'
import { variant } from 'styled-system'
import { Link } from 'gatsby'
import AniLink from 'gatsby-plugin-transition-link/AniLink'

const H1 = styled.h1(
	{
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.primary
	},
	variant({
		variants: {
			primary: {
				fontSize: [ 30, 30, 34 ],
				lineHeight: 1.17,
				fontWeight: 800,
				marginBottom: [ '0.5rem', '0.5rem', '0.5rem' ]
			},
			secondary: {
				fontWeight: 400
			}
		}
	})
)

const H2 = styled.h2(
	{
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.secondary
	},
	variant({
		variants: {
			primary: {
				fontSize: [ 30, 30, 34 ],
				lineHeight: 1.17,
				fontWeight: 300,
				letterSpacing: [ -0.8, -0.8, -0.8 ]
			},
			secondary: {
				fontWeight: 800,
				display: 'inline'
			}
		}
	})
)

const H3 = styled.h3(
	{
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.primary
	},
	variant({
		variants: {
			primary: {
				fontSize: '34px',
				fontWeight: 800,
				display: 'inline'
			},
			secondary: {}
		}
	})
)

const H4 = styled.h4(
	{
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.secondary
	},
	variant({
		variants: {
			primary: {
				fontSize: '34px',
				fontWeight: 300,
				display: 'inline',
				letterSpacing: '-0.8px'
			}
		}
	})
)

const H5 = styled.h5(
	{
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.primary
	},
	variant({
		variants: {
			primary: {
				fontSize: [ 19, 19, 19 ],
				lineHeight: 1.17,
				fontWeight: 600
			}
		}
	})
)

const Tag = styled(AniLink)(
	{
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.tertiary
	},
	variant({
		variants: {
			primary: {
				fontSize: '0.875rem',
				lineHeight: '1.1',
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

const ErrorMessage = styled.span(
	{
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.error
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
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.primary
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

const Heading = ({ heading, variant, children, ...rest }) =>
	({
		1: (
			<H1 variant={variant} color="error">
				{children}
			</H1>
		),
		2: <H2 variant={variant}>{children}</H2>,
		3: <H3 variant={variant}>{children}</H3>,
		4: <H4 variant={variant}>{children}</H4>,
		5: <H5 variant={variant}>{children}</H5>,
		tag: (
			<Tag variant={variant} {...rest}>
				{children}
			</Tag>
		),
		error: <ErrorMessage variant={variant}>{children}</ErrorMessage>,
		notify: <NotficationMessage variant={variant}>{children}</NotficationMessage>
	}[heading] || <p>{children}</p>)

export default Heading
