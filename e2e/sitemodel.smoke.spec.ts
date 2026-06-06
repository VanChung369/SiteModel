import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)

  expect(hasOverflow).toBe(false)
}

async function selectViewerTool(page: import('@playwright/test').Page, name: RegExp) {
  const tool = page.getByRole('button', { name })

  await tool.click()
  await expect(tool).toHaveAttribute('aria-pressed', 'true')
}

test.describe('SiteModel smoke flows', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
    page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message, err.stack))
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
  })

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

    await selectViewerTool(page, /^measure$/i)
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
    await expect(page.locator('.issue-register-strip')).toContainText('East Facade Panels')
    await expect(page.locator('.issue-register-strip')).toContainText('1 open')
    await selectViewerTool(page, /^measure$/i)
    await expect(page.locator('.measure-overlay')).toBeVisible()
    await page.locator('.issue-register-strip').getByRole('button', { name: /East Facade Panels/i }).click()
    await expect(page.getByText('Issue view restored')).toBeVisible()
    await expect(page.locator('.move-overlay')).toContainText('East Facade Panels')
    await page.getByRole('button', { name: /mark east facade panels coordination issue in review/i }).click()
    await expect(page.locator('.issue-item em').first()).toHaveText('In Review')
    await page.getByRole('button', { name: /resolve east facade panels coordination issue/i }).click()
    await expect(page.locator('.issue-item em').first()).toHaveText('Resolved')
    await page.getByRole('button', { name: /reopen east facade panels coordination issue/i }).click()
    await expect(page.locator('.issue-item em').first()).toHaveText('Open')
  })

  test('enforces viewer project permissions as read-only', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Long Bien Depot/i }).click()

    await expect(page.locator('.role-badge')).toHaveText('Viewer')
    await expect(page.getByText('Import disabled for viewer role')).toBeVisible()
    await expect(page.getByRole('textbox', { name: /view name/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /sync/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /save view/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /create object/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /select and move concrete core a/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /hide concrete core a/i })).toBeDisabled()
    await expect(page.getByLabel(/object name/i)).toBeDisabled()
    await expect(page.getByRole('button', { name: /add issue/i })).toBeDisabled()

    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByText('Share link ready')).toBeVisible()
  })

  test('creates and restores a shared view link', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /select and move east facade panels/i }).click()
    await page.getByRole('button', { name: /hide level 08 slab/i }).click()
    await expect(page.getByRole('button', { name: /show level 08 slab/i })).toBeVisible()
    await page.getByRole('button', { name: /share/i }).click()

    await expect(page.getByText('Share link ready')).toBeVisible()
    await expect(page.getByRole('link', { name: /shared view link/i })).toBeVisible()
    const shareHref = await page.getByRole('link', { name: /shared view link/i }).getAttribute('href')
    expect(shareHref).toContain('#view=')

    await page.evaluate(() => window.localStorage.clear())
    await page.goto('about:blank')
    await page.goto(shareHref ?? '/')

    await expect(page.getByText('Shared view loaded')).toBeVisible()
    await expect(page.locator('.inspector .panel-header strong')).toHaveText('East Facade Panels')
    await expect(page.locator('.move-overlay')).toContainText('East Facade Panels')
    await expect(page.getByRole('button', { name: /show level 08 slab/i })).toBeVisible()
  })

  test('persists workspace edits across reloads', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /select and move east facade panels/i }).click()
    await expect(page.locator('.inspector .panel-header strong')).toHaveText('East Facade Panels')

    await page.getByLabel(/view name/i).fill('Persisted coordination view')
    await page.getByLabel(/object name/i).fill('Persisted Facade Panels')
    await expect(page.locator('.inspector .panel-header strong')).toHaveText('Persisted Facade Panels')
    await page.waitForFunction(() => {
      const snapshot = window.localStorage.getItem('sitemodel.workspace.v1')

      if (!snapshot) {
        return false
      }

      const parsedSnapshot = JSON.parse(snapshot)
      return (
        parsedSnapshot.viewName === 'Persisted coordination view' &&
        parsedSnapshot.objects?.some((object: { id: string; name: string }) => object.id === 'facade-east' && object.name === 'Persisted Facade Panels')
      )
    })

    await page.getByLabel(/issue note/i).fill('Persisted issue note.')
    await page.getByRole('button', { name: /add issue/i }).click()
    await expect(page.locator('.issue-item').first()).toContainText('Persisted issue note.')
    await page.getByRole('button', { name: /save view/i }).click()

    await page.waitForFunction(() => {
      const snapshot = window.localStorage.getItem('sitemodel.workspace.v1')

      if (!snapshot) {
        return false
      }

      const parsedSnapshot = JSON.parse(snapshot)
      return (
        parsedSnapshot.selectedId === 'facade-east' &&
        parsedSnapshot.savedViews?.[0]?.name === 'Persisted coordination view' &&
        parsedSnapshot.issues?.[0]?.note === 'Persisted issue note.' &&
        parsedSnapshot.objects?.some((object: { id: string; name: string }) => object.id === 'facade-east' && object.name === 'Persisted Facade Panels')
      )
    })

    await page.reload()

    await expect(page.locator('.inspector .panel-header strong')).toHaveText('Persisted Facade Panels')
    await expect(page.locator('.issue-item').first()).toContainText('Persisted issue note.')
    await expect(page.getByText('1 saved view')).toBeVisible()
    await expect(page.locator('.saved-view-strip')).toContainText('Persisted coordination view')
  })

  test('loads version-specific object sets', async ({ page }) => {
    await page.goto('/')
    const objectList = page.locator('.object-list')

    await page.getByRole('button', { name: /structure v08\.ifc/i }).click()
    await expect(page.locator('.canvas-meta strong')).toHaveText('Structure v08.ifc')
    await expect(objectList.getByText('Transfer Beam B2')).toBeVisible()
    await page.getByRole('button', { name: /^Transfer Beam B2 Structural - L02$/i }).click()
    await expect(page.locator('.inspector')).toContainText('IFC GUID: 2TransferBeamB2')
    await expect(page.locator('.inspector')).toContainText('Volume: 445 m3')

    await page.getByRole('button', { name: /existing survey\.ifc/i }).click()
    await expect(page.locator('.canvas-meta strong')).toHaveText('Existing survey.ifc')
    await expect(objectList.getByText('Survey Boundary')).toBeVisible()

    await page.getByRole('button', { name: /coordination markups\.json/i }).click()
    await expect(page.locator('.canvas-meta strong')).toHaveText('Coordination markups.json')
    await expect(objectList.getByText('Markup Clash Zone 17')).toBeVisible()
  })

  test('converts imported non-GLB model files through the queue', async ({ page }) => {
    await page.goto('/')

    await page.locator('input[type="file"]').setInputFiles({
      name: 'field-upload.ifc',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('ISO-10303-21;'),
    })
    const uploadRow = page.locator('.upload-row').filter({ hasText: 'field-upload.ifc' })

    await expect(uploadRow).toContainText('field-upload.ifc')
    await expect(uploadRow).toContainText('job-ifc')
    await expect(uploadRow.locator('.conversion-track')).toBeVisible()
    await expect(uploadRow).toContainText('Converted GLB is ready', { timeout: 20000 })
    await expect(uploadRow).toContainText('Converted')
  })

  test('loads uploaded OBJ files directly into the viewer', async ({ page }) => {
    await page.goto('/')

    await page.locator('input[type="file"]').setInputFiles({
      name: 'building_04.obj',
      mimeType: 'text/plain',
      buffer: Buffer.from(['o Building_04', 'v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'f 1 2 3'].join('\n')),
    })

    const uploadRow = page.locator('.upload-row').filter({ hasText: 'building_04.obj' })

    await expect(page.locator('.canvas-meta strong')).toHaveText('building_04.obj')
    await expect(uploadRow).toContainText('Ready for browser preview')
    await expect(uploadRow).toContainText('Converted')
    await expect(uploadRow).not.toContainText(/job-obj/i)
    await expect(page.locator('canvas')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('mobile layout keeps primary viewer controls usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.locator('.viewport-card').scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: /^move$/i })).toBeVisible()
    await selectViewerTool(page, /^move$/i)
    await expect(page.locator('.move-overlay')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
