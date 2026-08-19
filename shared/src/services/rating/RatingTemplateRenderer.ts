import fs from 'node:fs'
import path from 'node:path'
import nunjucks from 'nunjucks'

type RatingTemplateData = {
  questionId: string
  rating: { averageMark?: number; markCount?: number }
  userMark?: number
}
const template = fs.readFileSync(path.resolve(process.cwd(), 'shared/templates/fragments/rating-form.html'), 'utf8')
export default class RatingTemplateRenderer {
  public render(data: RatingTemplateData): string {
    return nunjucks.renderString(template, data)
  }
}
