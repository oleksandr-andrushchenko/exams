import { app } from './server'

const port = Number(process.env.PORT || 3000)
app.listen(port, '0.0.0.0', () => console.log(`ExamMe web listening on ${port}`))
