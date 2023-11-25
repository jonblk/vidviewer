describe('edit video', () => {
  const playlist = 'test-edit-video'
  const videoTitle = 'video1'
  const addToPlaylist = 'test-playlist' 

  const openEditMenu = (playlist: string, title: string) => {
    cy.get(`[data-testid="playlist-${playlist}"]`).click();
    cy.get(`[data-testid="video-thumbnail-${title}"]`).trigger('mouseover');
    cy.get(`[data-testid=video-item-more-icon]`).click();
  }

  before(() => cy.setRootPath());

  beforeEach(() => {
    cy.visit(Cypress.env('root_url'))
    openEditMenu(playlist, videoTitle);
  });


  it('displays correct title in title input', () => {
    cy.get('input#title').should('have.value', videoTitle);
  });

  it('updates title when changing title', () => {
    const newTitle = 'hey'
    cy.get('input#title').clear();
    cy.get('input#title').type(newTitle);
    cy.closeModal();
    cy.get(`[data-testid="video-thumbnail-${videoTitle}"]`).should('not.exist');
    cy.get(`[data-testid="video-thumbnail-${newTitle}"]`).should('exist');

    cy.get(`[data-testid="video-thumbnail-${newTitle}"]`).trigger('mouseover');
    cy.get(`[data-testid=video-item-more-icon]`).click();

    cy.get('input#title').clear();
    cy.get('input#title').type(videoTitle);
    cy.closeModal(); 
    cy.get(`[data-testid="video-thumbnail-${newTitle}"]`).should('not.exist');
    cy.get(`[data-testid="video-thumbnail-${videoTitle}"]`).should('exist');
  });

  it('adds video to another playlist when updating playlist checkbox', () => {
    cy.get(`[data-testid="checkbox-toggle-${addToPlaylist}"]`).click()
    cy.closeModal()

    // Check if video added to playlist
    cy.get(`[data-testid="video-grid-item-${videoTitle}"]`).should('exist');

    // Reset
    openEditMenu(addToPlaylist, videoTitle);
    cy.get(`[data-testid="checkbox-toggle-${addToPlaylist}"]`).click()
    cy.closeModal()
    cy.get(`[data-testid="video-grid-item-${videoTitle}"]`).should('not.exist');
  });

  it('removes video from current playlist when updating playlist checkbox', () => {
    cy.get(`[data-testid="video-grid-item-${videoTitle}"]`).should('exist');

    cy.get(`[data-testid="checkbox-toggle-${playlist}"]`).click();
    cy.closeModal();

    // Check if video removed from playlist
    cy.get(`[data-testid="video-grid-item-${videoTitle}"]`).should('not.exist');

    // Reset
    openEditMenu('All', videoTitle);
    cy.get(`[data-testid="checkbox-toggle-${playlist}"]`).click();
    cy.closeModal();
    cy.get(`[data-testid="video-grid-item-${videoTitle}"]`).should('exist');
  });

  it('shows delete warning when delete clicked', () => {
    cy.get(`[data-testid="toggle-video-delete-warning"]`).click();
    cy.contains('Delete this video?').should('exist')
  });

  it('closes delete warning when cancel clicked', () => {
    cy.get(`[data-testid="toggle-video-delete-warning"]`).click();
    cy.contains('Delete this video?').should('exist')
    cy.get(`[data-testid="cancel-video-delete"]`).click();
    cy.contains('Delete this video?').should('not.exist')
  });

  it('closes modal and deletes video when delete clicked', () => {
    cy.get(`[data-testid="modal"]`).should('exist')
    cy.get(`[data-testid="toggle-video-delete-warning"]`).click();
    cy.get(`[data-testid="confirm-video-delete"]`).click();

    cy.get(`[data-testid="modal"]`).should('not.exist')

    // Make sure video is removed
    cy.get(`[data-testid="video-grid-item-${videoTitle}"]`).should('not.exist');

    // Make sure it doesn't exist in 'All' videos
    cy.get(`[data-testid="playlist-${'All'}"]`).click();
    cy.get(`[data-testid="video-grid-item-${videoTitle}"]`).should('not.exist');

    // Reset! (add video back to db)
    cy.get('[data-testid="new-video-toggle"]').click();
    const fixturesFolder = Cypress.config('fixturesFolder');
    const filePath = `${fixturesFolder}/videos`;
    cy.addVideoFromDisk(playlist, filePath)

    cy.wait(8000)

    cy.reload()

    cy.get(`[data-testid="playlist-${playlist}"]`).click();
    cy.get(`[data-testid="video-grid-item-${videoTitle}"]`).should('exist');
  });
});