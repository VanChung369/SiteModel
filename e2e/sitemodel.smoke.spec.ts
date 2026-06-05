import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)

  expect(hasOverflow).toBe(false)
}

test.describe('SiteModel smoke flows', () => {
  test('loads app and keeps object controls usable', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('SiteModel')
    await expect(page.getByRole('heading', { name: 'Viewer' })).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible()
    await expectNoHorizontalOverflow(page)

    const objectList = page.locator('.object-list')

    await page.getByRole('searchbox', { name: /search objects/i }).fill('facade')
    await expect(objectList.getByText('East Facade Panels')).toBeVisible()
    await expect(objectList.getByText('Concrete Core A')).not.toBeVisible()
    await page.getByRole('button', { name: /^reset$/i }).click()
    await expect(objectList.getByText('Concrete Core A')).toBeVisible()

    await page.getByRole('button', { name: /hide east facade panels/i }).click()
    await page.getByRole('checkbox', { name: /visible only/i }).check()
    await expect(objectList.getByText('East Facade Panels')).not.toBeVisible()
    await page.getByRole('checkbox', { name: /visible only/i }).uncheck()
    await page.getByRole('button', { name: /show east facade panels/i }).click()
  })

  test('moves the selected object with direct canvas drag', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible()

    await page.getByRole('button', { name: /select and move east facade panels/i }).click()
    await expect(page.locator('.move-overlay')).toContainText('East Facade Panels')
    const selectedBeforeDrag = await page.locator('.inspector .panel-header strong').innerText()
    const xBeforeDrag = await page.getByLabel(/^position x$/i).inputValue()
    const canvasBox = await page.locator('canvas').boundingBox()
    expect(canvasBox).not.toBeNull()

    if (canvasBox) {
      await page.mouse.move(canvasBox.x + canvasBox.width * 0.52, canvasBox.y + canvasBox.height * 0.58)
      await page.mouse.down()
      await page.mouse.move(canvasBox.x + canvasBox.width * 0.35, canvasBox.y + canvasBox.height * 0.7, { steps: 8 })
      await page.mouse.up()
    }

    await expect(page.locator('.inspector .panel-header strong')).toHaveText(selectedBeforeDrag)
    await expect(page.getByLabel(/^position x$/i)).not.toHaveValue(xBeforeDrag)
    await expect(page.locator('.move-overlay')).toContainText('East Facade Panels')
  })

  test('measures two picked points and resets the measurement', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible()

    await page.getByRole('button', { name: /^measure$/i }).click()
    await expect(page.locator('.measure-overlay')).toBeVisible()
    const measureBox = await page.locator('canvas').boundingBox()
    expect(measureBox).not.toBeNull()

    if (measureBox) {
      await page.mouse.click(measureBox.x + measureBox.width * 0.35, measureBox.y + measureBox.height * 0.7)
      await page.mouse.click(measureBox.x + measureBox.width * 0.7, measureBox.y + measureBox.height * 0.6)
    }

    await expect(page.locator('.measure-row').filter({ hasText: /picked distance/i }).locator('strong')).not.toHaveText('-')
    await page.getByRole('button', { name: /reset measure/i }).click()
    await expect(page.locator('.measure-row').filter({ hasText: /picked distance/i }).locator('strong')).toHaveText('-')
  })

  test('creates and updates an issue from the selected object', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /select and move east facade panels/i }).click()
    await expect(page.locator('.inspector .panel-header strong')).toHaveText('East Facade Panels')

    await page.getByLabel(/issue assignee/i).fill('QA Lead')
    await page.getByLabel(/issue severity/i).selectOption('Medium')
    await page.getByLabel(/issue note/i).fill('Smoke test issue note.')
    await page.getByRole('button', { name: /add issue/i }).click()
    await expect(page.locator('.issue-item').first()).toContainText('Smoke test issue note.')
    await page.getByRole('button', { name: /mark east facade panels coordination issue in review/i }).click()
    await expect(page.locator('.issue-item em').first()).toHaveText('In Review')
    await page.getByRole('button', { name: /resolve east facade panels coordination issue/i }).click()
    await expect(page.locator('.issue-item em').first()).toHaveText('Resolved')
    await page.getByRole('button', { name: /reopen east facade panels coordination issue/i }).click()
    await expect(page.locator('.issue-item em').first()).toHaveText('Open')
  })

  test('loads version-specific object sets', async ({ page }) => {
    await page.goto('/')
    const objectList = page.locator('.object-list')

    await page.getByRole('button', { name: /structure v08\.ifc/i }).click()
    await expect(page.locator('.canvas-meta strong')).toHaveText('Structure v08.ifc')
    await expect(objectList.getByText('Transfer Beam B2')).toBeVisible()

    await page.getByRole('button', { name: /existing survey\.ifc/i }).click()
    await expect(page.locator('.canvas-meta strong')).toHaveText('Existing survey.ifc')
    await expect(objectList.getByText('Survey Boundary')).toBeVisible()

    await page.getByRole('button', { name: /coordination markups\.json/i }).click()
    await expect(page.locator('.canvas-meta strong')).toHaveText('Coordination markups.json')
    await expect(objectList.getByText('Markup Clash Zone 17')).toBeVisible()
  })

  test('queues imported non-GLB model files', async ({ page }) => {
    await page.goto('/')

    await page.locator('input[type="file"]').setInputFiles({
      name: 'field-upload.ifc',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('ISO-10303-21;'),
    })
    await expect(page.locator('.upload-list')).toContainText('field-upload.ifc')
    await expect(page.locator('.upload-list')).toContainText('Queued')
  })

  test('mobile layout keeps primary viewer controls usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.locator('.viewport-card').scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: /^move$/i })).toBeVisible()
    await page.getByRole('button', { name: /^move$/i }).click()
    await expect(page.locator('.move-overlay')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
