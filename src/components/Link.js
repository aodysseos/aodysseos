import React from 'react'
import styled, { css } from 'styled-components'
import { variant } from 'styled-system'
import AniLink from 'gatsby-plugin-transition-link/AniLink'

const CustomLink = styled(AniLink)(
	{
		fontFamily: ({ theme }) => theme.fontFamily,
		color: ({ theme }) => theme.primary,
		position: 'relative'
	},
	variant({
		variants: {
			primary: {
				fontSize: '1.1875rem',
				lineHeight: 1.2,
				fontWeight: 300,
				display: 'inline-block'
			}
		}
	}),
	css(() => {
		return `
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      height: 1px;
      width: 100%;
      background-color: ${({ theme }) => theme.primary};
    }`
	})
)

const ExternalLink = styled.a`
	position: relative;
	color: ${({ theme }) => theme.primary};
	&::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 0;
		height: 1px;
		width: 100%;
		background-color: ${({ theme }) => theme.primary};
	}
`

const Link = ({ href, variant, children, ...rest }) =>
	({
		primary: (
			<CustomLink to={href} variant={variant} {...rest}>
				{children}
			</CustomLink>
		),
		external: (
			<ExternalLink to={href} variant={variant} {...rest}>
				{children}
			</ExternalLink>
		)
	}[variant] || (
		<ExternalLink to={href} variant={variant} {...rest}>
			{children}
		</ExternalLink>
	))

export default Link
