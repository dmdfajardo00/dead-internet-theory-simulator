import { sqliteTable, text, integer, index, primaryKey, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

export const visitors = sqliteTable('visitors', {
  id: text('id').primaryKey(),
  // SHA-256 of the opaque session token; the raw token only lives in the HttpOnly cookie
  tokenHash: text('token_hash').notNull().unique(),
  // 'synthetic' rows are seeded bot audiences (they only ever like posts)
  kind: text('kind', { enum: ['guest', 'synthetic'] }).notNull().default('guest'),
  createdAt: integer('created_at').notNull(),
  lastSeenAt: integer('last_seen_at').notNull(),
})

export const debateRuns = sqliteTable('debate_runs', {
  id: text('id').primaryKey(),
  rootPostId: text('root_post_id').notNull().references((): AnySQLiteColumn => posts.id, { onDelete: 'cascade' }),
  // the post the AI is answering (root for initial runs, the human follow-up for follow-ups)
  targetPostId: text('target_post_id').notNull().references((): AnySQLiteColumn => posts.id, { onDelete: 'cascade' }),
  visitorId: text('visitor_id').notNull().references(() => visitors.id),
  kind: text('kind', { enum: ['initial', 'followup'] }).notNull(),
  personaId: text('persona_id'),
  personaOrder: text('persona_order', { mode: 'json' }).$type<string[]>(),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] }).notNull(),
  error: text('error'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => [
  index('debate_runs_root_idx').on(t.rootPostId),
  index('debate_runs_visitor_idx').on(t.visitorId, t.createdAt),
  index('debate_runs_created_idx').on(t.createdAt),
])

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  authorType: text('author_type', { enum: ['human', 'persona', 'bot'] }).notNull(),
  // visitor id for humans, persona id or bot id otherwise
  authorId: text('author_id').notNull(),
  parentId: text('parent_id').references((): AnySQLiteColumn => posts.id, { onDelete: 'cascade' }),
  // thread root (equals id for root posts) so a whole thread loads in one query
  rootId: text('root_id').notNull(),
  content: text('content').notNull(),
  media: text('media', { mode: 'json' }),
  topic: text('topic'),
  generator: text('generator', { enum: ['live', 'demo', 'seed'] }),
  debateId: text('debate_id'),
  createdAt: integer('created_at').notNull(),
}, (t) => [
  index('posts_feed_idx').on(t.parentId, t.createdAt),
  index('posts_root_idx').on(t.rootId, t.createdAt),
  index('posts_author_idx').on(t.authorType, t.authorId, t.createdAt),
  index('posts_topic_idx').on(t.topic),
])

export const reactions = sqliteTable('reactions', {
  visitorId: text('visitor_id').notNull().references(() => visitors.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at').notNull(),
}, (t) => [primaryKey({ columns: [t.visitorId, t.postId] }), index('reactions_post_idx').on(t.postId)])

export const bookmarks = sqliteTable('bookmarks', {
  visitorId: text('visitor_id').notNull().references(() => visitors.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at').notNull(),
}, (t) => [primaryKey({ columns: [t.visitorId, t.postId] }), index('bookmarks_visitor_idx').on(t.visitorId, t.createdAt)])
