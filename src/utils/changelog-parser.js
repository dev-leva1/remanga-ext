/**
 * Парсер changelog из userscript
 */

const changelogParser = {
  /**
   * Извлечение версии из userscript
   */
  parseVersion(scriptText) {
    const versionMatch = scriptText.match(/@version\s+(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : null;
  },

  /**
   * Сравнение версий (semver)
   */
  compareVersions(current, remote) {
    const parseCurrent = current.split('.').map(Number);
    const parseRemote = remote.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parseRemote[i] > parseCurrent[i]) return 1;
      if (parseRemote[i] < parseCurrent[i]) return -1;
    }
    return 0;
  },

  /**
   * Извлечение changelog из комментариев userscript
   */
  parseChangelog(scriptText) {
    const changelogMatch = scriptText.match(/\/\*\*\s*\n?\s*\*?\s*CHANGELOG\s*\n([\s\S]*?)\*\//);

    if (!changelogMatch) {
      return 'Список изменений недоступен';
    }

    const changelogText = changelogMatch[1];
    const lines = changelogText
      .split('\n')
      .map(line => line.replace(/^\s*\*\s*/, '').trim())
      .filter(line => line.length > 0);

    return lines.join('\n');
  },

  /**
   * Валидация версии
   */
  isValidVersion(version) {
    if (typeof version !== 'string') return false;
    return /^\d+\.\d+\.\d+$/.test(version);
  }
};
