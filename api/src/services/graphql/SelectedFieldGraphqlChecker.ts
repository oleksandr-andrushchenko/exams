import { GraphQLResolveInfo } from 'graphql/type'
import { Service } from 'typedi'
import { SelectionNode } from 'graphql/language/ast'

@Service()
export default class SelectedFieldGraphqlChecker {

  /**
   * Example operation:
   *
   * query PaginatedCategories($size: Int) {
   *   paginatedCategories(size: $size) {
   *     data {
   *       id
   *     }
   *     meta {
   *       nextCursor
   *       prevCursor
   *     }
   *   }
   * }
   *
   * Example use:
   *
   * checkSelectedField(info, ['PaginatedCategories', 'paginatedCategories', 'meta', 'nextCursor']) => TRUE
   * checkSelectedField(info, ['paginatedCategories', 'meta']) => TRUE
   * checkSelectedField(info, ['paginatedCategories', 'any']) => FALSE
   * checkSelectedField(info, ['any']) => FALSE
   *
   * @param {GraphQLResolveInfo} info
   * @param {string[]} path
   * @returns {boolean}
   */
  public checkSelectedField(info: GraphQLResolveInfo, path: string[]): boolean {
    for (const _path of this.iteratePaths(info.operation.selectionSet.selections)) {
      if (this.isSubArray([ ...[ info.operation.name.value ], ..._path ], path)) {
        return true
      }
    }

    return false
  }

  private* iteratePaths(selections: ReadonlyArray<SelectionNode>): Generator<any, [], any> {
    if (selections.length == 0) return yield []

    for (const selection of selections) {
      if (selection['selectionSet'] && selection['selectionSet']['selections']) {
        for (const path of this.iteratePaths(selection['selectionSet']['selections'])) {
          yield [ selection['name']['value'], ...path ]
        }
      } else {
        yield [ selection['name']['value'] ]
      }
    }
  }

  private isSubArray(array: any[], needle: any[]): boolean {
    const n = array.length
    const m = needle.length

    for (let i = 0; i <= n - m; i++) {
      let j: number

      for (j = 0; j < m; j++) {
        if (array[i + j] !== needle[j]) {
          break
        }
      }

      if (j === m) {
        return true
      }
    }

    return false
  }
}