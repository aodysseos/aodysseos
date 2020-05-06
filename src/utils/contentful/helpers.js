import _get from 'lodash/get'
import _split from 'lodash/split'

export const getAssetType = (assetObject) => {
	return _get(assetObject, 'fields.file.contentType')
		? _get(assetObject, 'fields.file.contentType')
		: _get(assetObject, 'fields.type')
}

export const getAssetSrc = (assetObject, options) => {
	let url = _get(assetObject, 'fields.file.url') ? _get(assetObject, 'fields.file.url') : _get(assetObject, 'file.url')

	if (url) {
		url = 'https:' + url
		const [ type, subtype ] = _split(getAssetType(assetObject), '/')
		const isImage = type === 'image'
		if (isImage) {
			const { width, height, fit } = options || {}
			url += '?q=80'
			url += `&w=${width || 800}`
			if (height) url += `&h=${height}`
			if (fit) url += `&fit=${fit}`
			const isJpg = subtype === 'jpg' || subtype === 'jpeg'
			if (isJpg) url = url + '&fl=progressive'
		}
	}
	return url
}

export const getAssetTitle = (assetObject) => {
	return _get(assetObject, 'fields.title')
}

export const getEntry = (node) => {
	return _get(node, 'data.target')
}

export const getEntrySlug = (node) => {
	return _get(node, 'data.target.fields.slug')
}

export const getEntryId = (node) => {
	return _get(node, 'data.target.sys.contentType.sys.id')
}

export const getEntryType = (node) => {
	return _get(node, 'data.target.sys.contentType.sys')
}

export const getEntryFields = (node) => {
	return _get(node, 'data.target.fields')
}

export const getEntryHyperlinkType = (node) => {
	const slug = getEntrySlug(node)
	const type = getEntryId(node)
	switch (type) {
		case 'article':
			return `/articles/${slug}`
		default:
			return `/${slug}`
	}
}

export const getCodeSnippetType = (node) => {
	return _get(node, 'data.target.fields.type')
}

export const getEntryURL = (entryNode) => {
	const nodeType = _get(entryNode, 'nodeType')
	const url = getEntryHyperlinkType(entryNode)
	if (nodeType === 'entry-hyperlink') {
		return url
	}
}
