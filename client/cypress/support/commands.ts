/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('isDarkMode', () => cy.wrap(Cypress.$('body').hasClass('dark')));

Cypress.Commands.add('setRootPath', () => {
 cy.visit(Cypress.env('root_url'));

  cy.get('body').then($body => {
   if ($body.find('#root_folder_path').length > 0) {
     cy.get('#root_folder_path').type(Cypress.env("SAMPLE_LIBRARY_PATH"));
     cy.get('button[type="submit"]').click();
   } else {
     cy.get('[data-testid="config-form-toggle"]').click();
     cy.get('#root_folder_path').clear();
     cy.get('#root_folder_path').type(Cypress.env("SAMPLE_LIBRARY_PATH"));
     cy.get('button[type="submit"]').click();
   }
 });
});

declare namespace Cypress {
 interface Chainable {
   setRootPath: () => void;
   isDarkMode: () => Chainable<boolean>;
 }
}



//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }