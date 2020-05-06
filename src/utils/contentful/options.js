import React from 'react'
import _get from 'lodash/get'
import _split from 'lodash/split'
import styled from 'styled-components'
import { MARKS, BLOCKS, INLINES } from '@contentful/rich-text-types'

import {
	getEntryId,
	getEntryFields,
	getCodeSnippetType,
	getAssetType,
	getAssetSrc,
	getAssetTitle,
	getEntryURL
} from './helpers'

import Heading from '../../components/Heading'
import Paragraph from '../../components/Paragraph'
import Link from '../../components/Link'
import CodeSnippet from '../../components/CodeSnippet'
import Code from '../../components/Code'

import Image from '../../components/Article/ArticleImage'

const Video = styled.video`max-width: 100%;`

const Img = ({ children, alt }) => <Image src={children} alt={alt} />

const getHyperlinkObject = (hyperlinkNode) => {
	const hyperlinkOptions = {
		gist: 'https://gist.github.com',
		codesandbox: 'https://codesandbox.io/embed/'
	}

	const title = _get(hyperlinkNode, 'content.0.value', '')
	const uri = _get(hyperlinkNode, 'data.uri')

	let isGithub = false
	let isCodeSandbox = false
	if (uri) {
		isGithub = uri.startsWith(hyperlinkOptions.gist)
		isCodeSandbox = uri.startsWith(hyperlinkOptions.codesandbox)
	} else {
		const target = _get(hyperlinkNode, 'data.target')
	}

	if (isGithub) {
		return {
			title,
			type: 'gist',
			id: _split(uri, /^((http[s]):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.js)/)[6]
		}
	} else if (isCodeSandbox) {
		return {
			title,
			type: 'codesandbox',
			uri
		}
	} else {
		return { title, type: 'hyperlink', uri }
	}
}

const getEmbededEntry = (node, children) => {
	const fields = getEntryFields(node)
	const entryId = getEntryId(node)

	if (entryId === 'codeSnippet') {
		const type = getCodeSnippetType(node)
		return <CodeSnippet type={type} {...fields} />
	} else {
		return children
	}
}

const options = {
	renderMark: {
		[MARKS.BOLD]: (text) => <b key={`${text}-key`}>{text}</b>,
		[MARKS.ITALIC]: (text) => <div>{text}</div>,
		[MARKS.UNDERLINE]: (text) => <div>{text}</div>,
		[MARKS.CODE]: (text) => <Code language="javascript">{text}</Code>
	},
	renderNode: {
		[BLOCKS.HEADING_3]: (node, children) => (
			<Heading heading={3} variant={'primary'}>
				{children}
			</Heading>
		),
		[BLOCKS.HEADING_4]: (node, children) => (
			<Heading heading={4} variant={'primary'}>
				{children}
			</Heading>
		),
		[BLOCKS.HEADING_5]: (node, children) => (
			<Heading heading={5} variant={'primary'}>
				{children}
			</Heading>
		),
		[BLOCKS.HEADING_6]: (node, children) => (
			<Heading heading={6} variant={'primary'}>
				{children}
			</Heading>
		),
		[BLOCKS.PARAGRAPH]: (node, children) => (
			<Paragraph paragraph={1} variant={'primary'}>
				{children}
			</Paragraph>
		),
		[BLOCKS.EMBEDDED_ENTRY]: (node, children) => {
			// const target = _get(node, 'data.target')
			return getEmbededEntry(node, children)
		},
		'embedded-asset-block': (node, children) => {
			const target = _get(node, 'data.target')
			const [ assetType ] = getAssetType(target).split('/')

			switch (assetType) {
				case 'image':
					return <Img alt={getAssetTitle(target)}>{getAssetSrc(target)}</Img>
				case 'video':
					return <Video>{getAssetSrc(target)}</Video>
				default:
					return (
						<Link href={getAssetSrc(target)} target="_blank" variant="external">
							{children}
						</Link>
					)
			}
		},
		[INLINES.HYPERLINK]: (node, children) => {
			const hyperlinkObj = getHyperlinkObject(node)
			switch (hyperlinkObj.type) {
				case 'gist':
					return <CodeSnippet type="gist" {...hyperlinkObj} />
				case 'codesandbox':
					return <CodeSnippet type="codesandbox" {...hyperlinkObj} />
				default:
					return (
						<Link href={hyperlinkObj.uri} target="_blank" variant="primary">
							{hyperlinkObj.title}
						</Link>
					)
			}
		},
		[INLINES.ENTRY_HYPERLINK]: (node, children) => {
			const url = getEntryURL(node)
			return (
				<Link href={url} variant="primary">
					{children}
				</Link>
			)
		}
	}
}

export default options
