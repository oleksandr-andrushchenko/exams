import { Client } from 'pg'
import { ConnectionManager, DataSource, DataSourceOptions } from 'typeorm'

export const createPostgresConnection = (options: DataSourceOptions) => {
  const connectionManager = new ConnectionManager()
  const dataSource = connectionManager.create(options)
  return { connectionManager, dataSource }
}

export async function initializePostgres(dataSource: DataSource, url: string, schema: string): Promise<void> {
  const escapedSchema = schema.replace(/"/g, '""')
  const client = new Client({ connectionString: url })
  await client.connect()
  await client.query('CREATE SCHEMA IF NOT EXISTS "' + escapedSchema + '"')
  await client.end()
  await dataSource.initialize()
}
