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

  // NOTE cypress resets local storage after cy.reload() - fix later
  it.skip('retains light/dark mode when page refreshed', () => {
      cy.get("[data-testid=light-dark-toggle]").click();
      cy.isDarkMode().then((isDarkAfterToggle) => {
        cy.reload();
        cy.get('body').then(() => {
          cy.isDarkMode().then((isDarkAfterReload) => {
          expect(isDarkAfterToggle).to.equal(isDarkAfterReload);
       });
        });
      });
  })
});