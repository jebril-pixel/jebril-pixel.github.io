// Formulaire de contact : envoi réel des messages par e-mail via Formspree.

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mgavjwrq';

// Adresse affichée si l'envoi échoue, et utilisée tant que Formspree n'est pas configuré
const CONTACT_EMAIL = 'jeb.boufrour@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }

    // Effets visuels et validation simple des champs
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
        input.addEventListener('focus', () => input.parentElement.classList.add('focused'));

        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
            if (input.value.trim() !== '') {
                input.classList.add('valid');
                input.classList.remove('invalid');
            } else if (input.hasAttribute('required')) {
                input.classList.add('invalid');
                input.classList.remove('valid');
            }
        });
    });
});

/**
 * Valide le formulaire puis l'envoie à Formspree (ou ouvre la messagerie si Formspree n'est pas configuré).
 * @param {Event} e - L'événement de soumission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;

    // 1) Vérification des champs obligatoires
    let isValid = true;
    form.querySelectorAll('[required]').forEach(field => {
        const ok = field.value.trim() !== '' && field.checkValidity();
        field.classList.toggle('invalid', !ok);
        if (!ok) isValid = false;
    });
    if (!isValid) {
        showFormMessage('Veuillez remplir correctement tous les champs obligatoires.', 'error');
        return;
    }

    const data = new FormData(form);
    const button = form.querySelector('button[type="submit"]');

    // 2) Solution de secours : tant que l'ID Formspree n'a pas été collé, on ouvre la messagerie du visiteur
    if (FORMSPREE_ENDPOINT.includes('COLLE_ICI')) {
        const body = `${data.get('message')}\n\n— ${data.get('name')} (${data.get('email')})`;
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(body)}`;
        showFormMessage(`Votre application de messagerie va s'ouvrir : il ne reste qu'à envoyer le message. Sinon, écrivez-moi à ${CONTACT_EMAIL}.`, 'success');
        return;
    }

    // 3) Envoi réel : sujet de l'e-mail que tu recevras. L'adresse du champ "email" devient automatiquement l'adresse de réponse.
    data.set('_subject', `Portfolio : ${data.get('subject')}`);

    // On bloque le bouton pendant l'envoi pour éviter les doublons
    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = 'Envoi en cours...';

    try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json' }, // demande une réponse JSON au lieu d'une redirection
            body: data
        });

        if (response.ok) {
            showFormMessage('Merci ! Votre message a bien été envoyé, je vous réponds rapidement.', 'success');
            form.reset();
            form.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
        } else {
            throw new Error('Réponse ' + response.status);
        }
    } catch (error) {
        // Le texte saisi est conservé, et l'adresse e-mail est affichée en alternative
        showFormMessage(`L'envoi a échoué. Réessayez, ou écrivez-moi directement à ${CONTACT_EMAIL}.`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalLabel;
    }
}

/**
 * Affiche un message après tentative d'envoi du formulaire
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de message ('success' ou 'error')
 */
function showFormMessage(message, type) {
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) existingMessage.remove();

    const el = document.createElement('div');
    el.className = `form-message ${type}`;
    el.textContent = message;
    el.style.padding = '10px';
    el.style.marginTop = '15px';
    el.style.borderRadius = '5px';
    el.style.fontWeight = '500';
    el.style.backgroundColor = type === 'success' ? '#d1e7dd' : '#f8d7da';
    el.style.color = type === 'success' ? '#0a3622' : '#842029';

    document.getElementById('contactForm').appendChild(el);

    // Disparition automatique après 8 secondes
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.5s ease';
        setTimeout(() => el.remove(), 500);
    }, 8000);
}
