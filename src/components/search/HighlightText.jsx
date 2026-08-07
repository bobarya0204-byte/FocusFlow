import { highlightText } from '../../utils/universalSearch'

function HighlightText({ text, query, className = '' }) {
  const segments = highlightText(text, query)

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.highlight ? (
          <mark key={index} className="universal-search-highlight">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  )
}

export default HighlightText
