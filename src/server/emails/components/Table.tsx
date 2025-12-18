import { colors } from './BaseLayout'

interface TableColumn {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
}

interface TableProps {
  columns: TableColumn[]
  data: Record<string, React.ReactNode>[]
  headerBgColor?: string
}

export function Table({
  columns,
  data,
  headerBgColor = '#f8f9fa',
}: TableProps) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr style={{ backgroundColor: headerBgColor }}>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{ ...thStyle, textAlign: col.align || 'left' }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col) => (
              <td
                key={col.key}
                style={{ ...tdStyle, textAlign: col.align || 'left' }}
              >
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '20px 0',
  fontSize: '14px',
}

const thStyle: React.CSSProperties = {
  padding: '12px 10px',
  border: `1px solid ${colors.border}`,
  fontWeight: 'bold',
}

const tdStyle: React.CSSProperties = {
  padding: '10px',
  border: `1px solid ${colors.border}`,
}
