import { test, expect } from '@playwright/test';
import tags from '../test-data/tags.json'

test.beforeEach(async ({ page }) => {
    await page.route('*/**/api/tags', async route => {
        await route.fulfill({
            body: JSON.stringify(tags)
        })
    })
    await page.goto('https://angular.realworld.io/');
})

test('has title', async ({ page }) => {
    await page.route('*/**/api/articles*', async route => {
        const response = await route.fetch()
        const responseBody = await response.json()
        responseBody.articles[0].title = "This is a test title"
        responseBody.articles[0].description = "This is a descrription"

        await route.fulfill({
            body: JSON.stringify(responseBody)
        })
    })

    await page.getByText('Global Feed').click()
    await expect(page.locator('.navbar-brand')).toHaveText('conduit')
    await expect(page.locator('.app-article-list h1').first()).toContainText('This is a test title')
    await expect(page.locator('.app-article-list p').first()).toContainText('This is a description')
});

test('delete article', async ({ page, request }) => {
    const articleResponse = await request.post('https://api.realworld.io/api/articles/', {
        data: {
            "article": { "tagList": [], "title": "This is a test title", "description": "this is a description", "body": "this is a test body" }
        }
    
    })
    expect(articleResponse.status()).toEqual(201)

    await page.getByText('Global Feed').click()
    await page.getByText('This is a test article').click()
    await page.getByRole('button', { name: "Delete Article" }).first().click()
    await page.getByText('Global Feed').click()


})

test('create and delete', async ({ page, request }) => {
    await page.getByText('New Article').click()
    await page.getByRole('textbox', { name: 'Article Title' }).fill('Playwright is awesome')
    await page.getByRole('textbox', { name: "What's this article about?" }).fill("test")
    await page.getByRole('textbox', { name: "Write your article (in markdown)" }).fill("test1")
    await page.getByRole('button', { name: "Publish Article" }).click()

    const articleResponse = await page.waitForResponse('https://api.realworld.io/api/articles/')
    const articleResponseBody = await articleResponse.json()
    const slugId = articleResponseBody.article.slugId

    await expect(page.locator('article-page h1')).toContainText("Playwright is awesome")
    await page.getByText('Home').click()
    await page.getByText('Global Feed').click()
    await expect(page.locator('article-page h1').first()).toContainText("Playwright is awesome")

    const deleteArticleResponse = await request.delete(`https://api.realworld.io/api/articles/${slugId}`, {
    
    })
    expect(articleResponse.status()).toEqual(204)

})