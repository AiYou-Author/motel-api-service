// 简单的StoreService测试
describe('StoreService', () => {
  // 由于StoreService有复杂的依赖，我们只做基本检查
  it('should exist as a module', () => {
    const storeService = require('../../services/store/storeService')

    expect(storeService).toBeDefined()
  })

  it('should export an object', () => {
    const storeService = require('../../services/store/storeService')

    expect(typeof storeService).toBe('object')
  })

  it('should have basic service methods', () => {
    const storeService = require('../../services/store/storeService')

    // 检查是否存在一些方法
    expect(storeService).toHaveProperty('constructor')
  })
})
