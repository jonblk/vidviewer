describe('Load video from disk', () => {
  const playlist = 'test-load-disk'
  before(() => cy.setRootPath())

  beforeEach(() => {
    cy.visit(Cypress.env('root_url'));
    cy.get('[data-testid="new-video-toggle"]').click();
  });

  it('adds videos from disk', () => {
    const fixturesFolder = Cypress.config('fixturesFolder');
    const folderPath = `${fixturesFolder}/new_videos`;

    cy.addVideoFromDisk('test-load-disk', folderPath);

    cy.wait(20000);

    cy.reload();
    cy.get(`[data-testid="playlist-${playlist}"]`).click();

    cy.task('getFiles', folderPath).then((filenames) => {
      for (let name of filenames as string[]) {
        cy.get(`[data-testid="video-grid-item-${name}"]`).should('exist'); 
      }
    });
  });

  it('displays error message if folder does not exist', () => {
    const fixturesFolder = Cypress.config('fixturesFolder');
    const folderPath = `${fixturesFolder}/folder-does-not-exist`;
    cy.addVideoFromDisk('test-load-disk', folderPath)
    cy.contains('Folder does not exist').should('be.visible')
  });

  it('displays error message if folder is empty', () => {
    const fixturesFolder = Cypress.config('fixturesFolder');
    const folderPath = `${fixturesFolder}/videos_empty`;
    cy.addVideoFromDisk('test-load-disk', folderPath)
    cy.contains('folder does not contain .mp4 or .webm files').should('be.visible')
  });

  it('does not add videos that already exist', () => {
    const fixturesFolder = Cypress.config('fixturesFolder');
    const folderPath = `${fixturesFolder}/new_videos`;

    cy.closeModal();
    cy.get(`[data-testid="playlist-${playlist}"]`).click();
    cy.get(`[data-testid="video-grid-container"]`).children('div[data-testid]').then(($videos) => {
      const videoCount = $videos.length;
      cy.get('[data-testid="new-video-toggle"]').click();
      cy.addVideoFromDisk('test-load-disk', folderPath)
      cy.wait(15000)
      cy.get(`[data-testid="video-grid-container"]`).children('div[data-testid]').then(($videosAfterLoad) => {
        expect(videoCount).to.equal($videosAfterLoad.length);
      });
    });
  });
});
