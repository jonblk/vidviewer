describe('Download video', () => {
  // Open sample library
  before(() => {
    cy.visit(Cypress.env('root_url'));
    cy.get('[data-testid="config-form-toggle"]').click();
    cy.get('#root_folder_path').clear();
    cy.get('#root_folder_path').type(Cypress.env("SAMPLE_LIBRARY_PATH"));
    cy.get('button[type="submit"]').click();
  });

  // Open new-video form
  beforeEach(() => {
    cy.visit(Cypress.env('root_url'));
    cy.get('[data-testid="new-video-toggle"]').click();
  });

  it('has a `source` dropdown', () => {
    cy.get('label[for="source"]').should('exist');
    cy.get('[data-testid="dropdown-button-source"]').should('exist');
  });

  it('has `URL` seleted in the source dropdown', () => {
    cy.contains('🔗 URL').should('exist')
  });

  it('has a `URL` input', () => {
    cy.get('label[for="url"]').should('exist');
    cy.get('input[id="url"]').should('exist');
  });

  // NOTE this is failing in cypress only
  it.skip('displays `invalid url` when invalid url is typed', ()=> {
    const invalidUrl = 'https://82u32108u12038u.org'
    cy.get('input[id="url"]').type(invalidUrl).trigger('change');
    cy.wait(9000)
    cy.contains('li', 'Invalid url').should('exist');
  })

  it('fetches resolution options when valid video URL is typed', () => {
    cy.get('input[id="url"]').type('https://archive.org/details/night_of_the_living_dead')
    cy.get('[data-testid="dropdown-button-video_format"]').click()
    cy.contains('button', '640x480').should('exist')
    cy.contains('button', '320x240').should('exist')
  }); 

  it('sets resolution when option is clicked', () => {
    cy.get('input[id="url"]').type('https://archive.org/details/night_of_the_living_dead')
    cy.get('[data-testid="dropdown-button-video_format"]').click()
    cy.get('[data-testid="option-video_format-320x240"]').click()
    cy.contains('span', '320x240').should('exist')
  }); 

  it('does not display `All` playlist in playlists dropdown', ()=> {
    cy.get('[data-testid="dropdown-button-playlist"]').click()
    cy.get(`button[data-testid="option-playlist-All"]`).should('not.exist');
  });

  it('displays playlists in the playlists dropdown', () => {
    cy.get('[data-testid="dropdown-button-playlist"]').click()
    for (let playlist of Cypress.env("playlists") as string[]) {
      if (playlist !== "All") {
        cy.contains(
          `button[data-testid="option-playlist-${playlist}"]`, 
          playlist
        ).should('exist');
      }
    }
  });

  // TODO
  it.skip('downloads video and adds it to the playlist\'s videos', () => {
  })
});