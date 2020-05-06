import React from 'react'

import SyntaxHighlighter from 'react-syntax-highlighter'
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import styled from 'styled-components'

const CodeWrapper = styled.div`
	display: inline-block;
	> code {
		padding: 0 0.2rem;
		font-size: 1rem;
	}
`

const PreTag = ({ children }) => <CodeWrapper>{children}</CodeWrapper>

const Code = ({ children, ...rest }) => (
	<SyntaxHighlighter {...rest} style={a11yLight} PreTag={PreTag}>
		{children}
	</SyntaxHighlighter>
)

export default Code
