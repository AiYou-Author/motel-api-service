# 开发工作流指南

## 分支策略

### 主要分支
- **`main`**：生产发布分支
  - 只接受来自`develop`分支的合并
  - 自动创建tag和发布版本
  - 运行完整的CI/CD流水线（包括Docker构建）
  
- **`develop`**：开发分支
  - 日常开发工作在此分支进行
  - 运行CI测试（lint, test, build）
  - 不自动创建tag或发布版本

### 支持分支
- **`feature/*`**：功能分支
  - 从`develop`分支创建
  - 完成功能开发后合并回`develop`
  
- **`hotfix/*`**：热修复分支
  - 从`main`分支创建
  - 紧急修复生产问题
  - 完成后同时合并到`main`和`develop`

## CI/CD流水线

### 1. 开发分支 (`develop`)
**触发条件**：推送到`develop`分支
**执行任务**：
- ✅ 代码质量检查（ESLint + Prettier）
- ✅ 单元测试（Jest + Vitest）
- ✅ 构建验证
- ❌ Docker构建（仅在main分支）

**配置文件**：`.github/workflows/ci.yml`

### 2. 主分支 (`main`)
**触发条件**：推送到`main`分支
**执行任务**：
- ✅ 自动发布流水线（创建tag + 发布版本）
- ✅ 完整的CI/CD流水线
- ✅ Docker镜像构建和推送

**配置文件**：`.github/workflows/auto-release-pipeline.yml`

### 3. Pull Request检查
**触发条件**：创建/更新Pull Request
**执行任务**：
- ✅ 代码质量检查
- ✅ 构建验证

**配置文件**：`.github/workflows/pr-lint-check.yml`

## 开发流程

### 开始新功能开发
```bash
# 1. 确保在develop分支
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 开发并提交代码
git add .
git commit -m "feat: 添加新功能"

# 4. 推送到远程
git push origin feature/your-feature-name
```

### 合并功能到开发分支
```bash
# 1. 创建Pull Request到develop分支
# 2. 等待CI检查通过
# 3. 代码审查
# 4. 合并到develop
```

### 发布新版本
```bash
# 1. 确保develop分支稳定
git checkout develop
git pull origin develop

# 2. 创建发布分支（可选）
git checkout -b release/v1.2.0

# 3. 合并到main分支
git checkout main
git merge develop --no-ff -m "chore: 发布v1.2.0"

# 4. 推送到main（自动触发发布）
git push origin main
```

## 版本管理

### 自动版本发布
- 推送到`main`分支会自动：
  1. 检测是否需要版本更新
  2. 创建Git tag（如`v1.1.314`）
  3. 构建Docker镜像并推送到GitHub Container Registry
  4. 更新`VERSION`文件

### 跳过自动发布
在提交消息中添加`[skip ci]`可以跳过自动发布：
```bash
git commit -m "chore: 更新文档 [skip ci]"
```

## 常见问题

### Q: 为什么推送到main分支会打tag？
A: 项目配置了自动发布流水线，推送到main分支会自动创建tag和发布版本。

### Q: 如何在开发过程中避免频繁打tag？
A: 所有开发工作在`develop`分支进行，只有准备发布时才合并到`main`分支。

### Q: 如何手动触发发布？
A: 在GitHub仓库的Actions页面，可以手动运行"Auto Release Pipeline"工作流。

### Q: Docker镜像在哪里？
A: Docker镜像推送到GitHub Container Registry，地址为：`ghcr.io/AiYou-Author/motel-api-service`

## 相关配置文件
- `.github/workflows/ci.yml` - 开发CI流水线
- `.github/workflows/auto-release-pipeline.yml` - 自动发布流水线
- `.github/workflows/pr-lint-check.yml` - PR检查
- `VERSION` - 版本文件