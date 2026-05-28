import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

// 创建一个简单的测试组件
const HelloWorld = {
  template: '<div>{{ msg }}</div>',
  props: {
    msg: {
      type: String,
      required: true
    }
  }
}

describe('HelloWorld Component', () => {
  it('renders props.msg when passed', () => {
    const msg = 'Hello, Vitest!'
    const wrapper = mount(HelloWorld, {
      props: { msg }
    })

    expect(wrapper.text()).toContain(msg)
  })

  it('has correct prop type', () => {
    expect(HelloWorld.props.msg.type).toBe(String)
    expect(HelloWorld.props.msg.required).toBe(true)
  })

  it('renders without props (should show empty)', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: '' }
    })

    expect(wrapper.text()).toBe('')
  })
})
