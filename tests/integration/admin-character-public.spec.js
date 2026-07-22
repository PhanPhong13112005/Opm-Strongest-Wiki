import { expect, test } from '@playwright/test'

const apiBaseUrl = 'http://127.0.0.1:5181'
const characterId = '100013-urplus'

test('Admin API update is rendered by the public Vue character detail page', async ({ page, request }) => {
  const loginResponse = await request.post(`${apiBaseUrl}/api/auth/login`, {
    data: {
      username: 'integration-admin',
      password: 'integration-password',
    },
  })
  expect(loginResponse.ok()).toBeTruthy()
  const token = (await loginResponse.json()).accessToken

  const characterResponse = await request.get(`${apiBaseUrl}/api/admin/characters/${characterId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(characterResponse.ok()).toBeTruthy()
  const originalCharacter = await characterResponse.json()
  const marker = Date.now()
  const updatedName = `Zombieman Integration ${marker}`
  const updatedBio = `Public profile updated through Admin API ${marker}`
  const updateResponse = await request.put(`${apiBaseUrl}/api/admin/characters/${characterId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      ...originalCharacter,
      nameVi: updatedName,
      nameEn: updatedName,
      bioVi: updatedBio,
      bioEn: updatedBio,
    },
  })
  expect(updateResponse.ok()).toBeTruthy()

  const publicApiResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/characters/${characterId}`) && response.request().method() === 'GET')

  await page.goto(`/character/${characterId}`)

  expect((await publicApiResponse).ok()).toBeTruthy()
  await expect(page.getByRole('heading', { name: updatedName, exact: true })).toBeVisible()
  await expect(page.getByText(updatedBio, { exact: true })).toBeVisible()
})
