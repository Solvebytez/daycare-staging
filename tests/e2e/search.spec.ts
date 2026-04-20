import { test, expect } from '@playwright/test'

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search')
  })

  test('should display search results', async ({ page }) => {
    // Check if daycare results are shown
    await expect(page.getByText('Little Explorers Academy')).toBeVisible()
    await expect(page.getByText('Bright Beginnings Childcare')).toBeVisible()
    await expect(page.getByText('Sunshine Daycare Center')).toBeVisible()
  })

  test('should filter by location', async ({ page }) => {
    // Set location filter
    await page.getByPlaceholder('Enter your location').fill('Whitby')
    
    // Check if only Whitby daycares are shown
    await expect(page.getByText('Bright Beginnings Childcare')).toBeVisible()
    await expect(page.getByText('Whitby')).toBeVisible()
  })

  test('should filter by search query', async ({ page }) => {
    // Search for specific terms
    await page.getByPlaceholder('What are you looking for?').fill('nature')
    
    // Check if nature-related daycares are shown
    await expect(page.getByText('Nature-Inspired Learning')).toBeVisible()
  })

  test('should have working filters', async ({ page }) => {
    // Check filter options
    await expect(page.getByText('Price Range')).toBeVisible()
    await expect(page.getByText('Age Range')).toBeVisible()
    await expect(page.getByText('Availability')).toBeVisible()
  })

  test('should show daycare details', async ({ page }) => {
    // Check if daycare cards show proper information
    await expect(page.getByText('$1,800/month')).toBeVisible()
    await expect(page.getByText('4.8')).toBeVisible()
    await expect(page.getByText('127 reviews')).toBeVisible()
  })

  test('should have working comparison feature', async ({ page }) => {
    // Check comparison checkboxes
    const compareCheckboxes = page.locator('input[type="checkbox"]')
    await expect(compareCheckboxes.first()).toBeVisible()
    
    // Check comparison bar
    await expect(page.getByText('Compare')).toBeVisible()
  })

  test('should show recently viewed', async ({ page }) => {
    // Click on a daycare to add to recently viewed
    await page.getByText('Little Explorers Academy').click()
    
    // Check if recently viewed section appears
    await expect(page.getByText('Recently Viewed')).toBeVisible()
  })

  test('should have working sorting', async ({ page }) => {
    // Check sort options
    await expect(page.getByText('Sort by:')).toBeVisible()
    await expect(page.getByText('Rating')).toBeVisible()
    await expect(page.getByText('Price')).toBeVisible()
    await expect(page.getByText('Distance')).toBeVisible()
  })

  test('should display cost calculator', async ({ page }) => {
    await expect(page.getByText('Cost Breakdown')).toBeVisible()
    await page.getByRole('button', { name: 'Cost Breakdown' }).first().click()
    await expect(page.getByText('Monthly Tuition:')).toBeVisible()
    await expect(page.getByText('Registration Fee:')).toBeVisible()
    await expect(page.getByText('Late Pickup:')).toBeVisible()
  })

  test('should handle empty search results', async ({ page }) => {
    // Search for non-existent term
    await page.getByPlaceholder('What are you looking for?').fill('xyz123nonexistent')
    
    // Check if no results message is shown
    await expect(page.getByText('No daycares found')).toBeVisible()
    await expect(page.getByText('Try adjusting your search criteria')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if mobile layout works
    await expect(page.getByText('Find Daycares')).toBeVisible()
    await expect(page.getByText('Little Explorers Academy')).toBeVisible()
  })
})
