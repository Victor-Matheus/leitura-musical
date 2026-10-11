import { Fragment } from 'react'
import { Lightbulb } from 'lucide-react'
import type { Block } from '../theory/types'
import { ScoreView } from './ScoreView'
import { Card, IconBox } from './ui'

/** Converte **negrito** simples em <strong>, sem dangerouslySetInnerHTML. */
function renderInline(text: string) {
  return text.split('**').map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
  )
}

export function LessonBlocks({ blocks, highContrast }: { blocks: Block[]; highContrast: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'text':
            return (
              <p key={i} className="text-lg leading-relaxed" style={{ color: 'var(--text)' }}>
                {renderInline(block.text)}
              </p>
            )
          case 'table':
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-base" style={{ color: 'var(--text)' }}>
                  <thead>
                    <tr>
                      {block.head.map((h, c) => (
                        <th
                          key={c}
                          scope="col"
                          className="px-3 py-2 font-bold"
                          style={{ borderBottom: '2px solid var(--border)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'tip':
            return (
              <Card key={i} className="flex items-start gap-4">
                <IconBox icon={Lightbulb} />
                <p className="text-lg leading-relaxed" style={{ color: 'var(--text)' }}>
                  <strong>Dica: </strong>
                  {renderInline(block.text)}
                </p>
              </Card>
            )
          case 'score': {
            const { kind: _kind, caption, ...score } = block
            void _kind
            return (
              <figure key={i} className="flex flex-col gap-2">
                <ScoreView {...score} highContrast={highContrast} />
                {caption && (
                  <figcaption className="text-center text-base" style={{ color: 'var(--muted)' }}>
                    {caption}
                  </figcaption>
                )}
              </figure>
            )
          }
        }
      })}
    </div>
  )
}
