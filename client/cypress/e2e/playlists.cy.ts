describe('Playlists', () => {
  before(() => cy.setRootPath())

  beforeEach(() => {
    cy.visit(Cypress.env('root_url'));
    cy.intercept("GET", "/playlists").as("getPlaylists");
  });

  it('should call /playlists on App mount', () => {
    cy.wait('@getPlaylists').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
  });

  it('should show playlists after loading library', () => {
    for (let playlist of Cypress.env("playlists") as string[]) {
      cy.contains(playlist).should('exist');
    }
  })

  it('should show `All` playlist', () => {
    cy.contains('All').should('exist');
  })

  // TODO
  it.skip('should not show edit icon when `All` playlist item hovered')
  
  it('should show edit icon when playlist item hovered', () => {
    cy.get(`[data-testid=edit-playlist-button-playlist1]`).should('not.exist')
    cy.contains('playlist1').trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-playlist1]`).should('exist')
  });

  it('should open edit playlist form when edit icon clicked', () => {
    cy.contains('playlist1').trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-playlist1]`).click()
    cy.contains('label', 'Playlist name').should('exist')
  });

  it('should update playlist name', () => {
    cy.contains('playlist1').trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-playlist1]`).click()
    const updatePlaylistName = "new"
    cy.get('#playlist-name').clear();
    cy.get('#playlist-name').type(updatePlaylistName); 
    cy.get(`[data-testid=update-playlist]`).click();
    cy.get(`[data-testid=playlist-${updatePlaylistName}]`).should('exist')
  });

  it('should show warning to delete playlist', () => {
    cy.contains('playlist2').trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-playlist2]`).click()
    cy.get(`[data-testid=warn-delete-playlist]`).click();
    cy.contains('Delete this playlist?').should('exist')
  });

  it('should go back to edit menu when clicking cancel delete', () => {
    cy.contains('playlist2').trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-playlist2]`).click()
    cy.get(`[data-testid=warn-delete-playlist]`).click();
    cy.get(`[data-testid=cancel-delete-button]`).click();
    cy.contains('Delete this playlist?').should('not.exist')
    cy.get('#playlist-name').should('exist')
  });

  it('should delete the playlist and remove it from the playlists list', () => {
    cy.contains('playlist2').trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-playlist2]`).click()
    cy.get(`[data-testid=warn-delete-playlist]`).click();
    cy.get(`[data-testid=delete-playlist-button]`).click();
    cy.get(`[data-testid=playlist-playlist2]`).should('not.exist')
  });

  it('should call /playlists after deleting', () => {
    cy.contains('playlist3').trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-playlist3]`).click()
    cy.get(`[data-testid=warn-delete-playlist]`).click();

    cy.intercept("GET", "/playlists").as("getPlaylists");
    cy.get(`[data-testid=delete-playlist-button]`).click();

    cy.wait('@getPlaylists').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
  })

  it('should add new playlist', () => {
    const newPlaylistName = "playlist999"
    cy.get(`[data-testid=new-playlist-button]`).click()
    cy.get('#playlist-name').clear();
    cy.get('#playlist-name').type(newPlaylistName); 
    cy.get(`[data-testid=create-playlist-button]`).click();
    cy.get(`[data-testid=playlist-${newPlaylistName}]`).should('exist')
  });
});