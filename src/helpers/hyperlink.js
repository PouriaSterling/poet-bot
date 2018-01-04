module.exports.jiraLink = (text) => {
    return `<${process.env.JIRA_URL}/browse/${text.replace(/ /g, '')}|${text.replace(/ /g, '').toUpperCase()}>`
};