describe('light/dark mode', () => {
  before(() => cy.setRootPath());
  beforeEach(() => cy.visit(Cypress.env('root_url')));

  it('toggles light/dark mode when toggle clicked', () => {
    cy.isDarkMode().then((isDark)=> {
      cy.get("[data-testid=light-dark-toggle]").click();
      cy.isDarkMode().then(isDarkAfterClick => {
        expect(isDark).to.not.equal(isDarkAfterClick)
      })
    })
  })

  it('retains light/dark mode when page refreshed', () => {
    cy.isDarkMode().then((isDark)=> {
      cy.get("[data-testid=light-dark-toggle]").click();
      cy.reload();
      cy.isDarkMode().then(isDarkAfterReload => {
        expect(isDark).to.not.equal(isDarkAfterReload)
      })
    })
  })
});