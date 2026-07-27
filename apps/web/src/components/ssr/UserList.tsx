import Link from 'next/link'

type User = { id: string; name?: string; createdAt?: string }
export default function UserList({users}: { users: User[] }) {
  return <div className="row row-cols-1 row-cols-md-2 g-3">{users.map(u => <article className="col" key={u.id}>
    <div className="card h-100">
      <div className="card-body"><Link className="fw-semibold"
                                       href={`/users/${u.id}`}>{u.name || "Unnamed user"}</Link>
        <p>Joined {u.createdAt ? new Date(u.createdAt).toDateString() : "recently"}</p></div>
    </div>
  </article>)}</div>
}
