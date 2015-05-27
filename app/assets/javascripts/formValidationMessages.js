function initFormErrorMessages() {

    var messages = [];
    messages['fraud-suspect'] = '' +
    '<p>Please make sure you enter at least</p>' +
    '<ul class="list-bullet error-summary-list">' +
    '<li>A name, approximate age (or date of birth) and an address</li>' +
    '<li>A name, approximate age (or date of birth) and some additional info (phone number, email address or social media URL)</li>' +
    '<li>A National insurance number and an approximate age (or date of birth)</li>' +
    '<li>A National insurance number and an address</li>' +
    '</ol>';

    messages['fraud-suspect__3strikes'] = '' +
    '<p>' +
    'Having trouble? Call us on 0800 854 440.<br>' +
    'Otherwise please make sure you enter at least' +
    '</p>' +
    '<ul class="list-bullet error-summary-list">' +
    '<li>A name, approximate age (or date of birth) and either an address or some additional info</li>' +
    '<li>A National insurance number and either an approximate age (or date of birth) or an address</li>' +
    '</ul>';

    return messages;
}
