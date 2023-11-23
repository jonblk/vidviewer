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

Cypress.Commands.add('addVideoFromDisk', (playlistTitle, path) => {
  // Select Disk option
  cy.get('[data-testid="dropdown-button-source"]').click();
  cy.get('[data-testid="option-source-📂 Disk"]').click();

  // Input folder path
  cy.get('[data-testid="folder-path-input"]').clear();
  cy.get('[data-testid="folder-path-input"]').type(path);

  // Select playlist
  cy.get('[data-testid="dropdown-button-playlist"]').click();
  cy.get(`[data-testid=option-playlist-${playlistTitle}]`).scrollIntoView().click();

  // Click download
  cy.get(`[data-testid=download-video-button]`).click();
})

Cypress.Commands.add('isDarkMode', () => {
  cy.wrap(Cypress.$('body').hasClass('dark'))
});

Cypress.Commands.add(
  'closeModal', 
  () => cy.get('[data-testid="close-modal-button"').click()
)

Cypress.Commands.add('setRootPath', (path="SAMPLE_LIBRARY_PATH") => {
  cy.visit(Cypress.env('root_url'));

  cy.get('body').then($body => {
    cy.wait(500).then(() => {
      if ($body.find("#root_folder_path").length > 0) {
        cy.get("#root_folder_path").type(Cypress.env(path));
        cy.get('button[type="submit"]').click();
      } else {
        cy.get('[data-testid="config-form-toggle"]').click();
        cy.get("#root_folder_path").clear();
        cy.get("#root_folder_path").type(Cypress.env(path));
        cy.get('button[type="submit"]').click();
      }
    });
 });
});

declare namespace Cypress {
 interface Chainable {
   setRootPath: (path?: string) => void;
   isDarkMode: () => Chainable<boolean>;
   closeModal: () => void; 
   addVideoFromDisk: (playlistTitle: string, filePath: string) => void;
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