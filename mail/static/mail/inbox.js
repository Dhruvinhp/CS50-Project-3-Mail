document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', create_email);
  document.querySelector('#email-link').addEventListener('click', view_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-recipients').disabled = false;
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-subject').disabled = false;
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none'

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(data => {
    console.log(data);

    data.forEach(element => {
      const div = document.createElement('div');
      div.innerHTML = `
            <div id = "email${element.id}" class = email>
                <div id = "email-subject">
                    <b>${element.sender}</b>&nbsp;&nbsp;${element.subject}
                </div>
                <div id = "date">
                    ${element.timestamp}
                </div>
            </div>
        `;


      document.querySelector('#emails-view').append(div);
      if (element.read)
      {
        document.querySelector(`#email${element.id}`).style.background = 'gray';
      }
      document.querySelector(`#email${element.id}`).addEventListener('click', () => view_email(element.id, mailbox));
      

    });
  });
}

function create_email() {
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector("#compose-body").value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  })
  .then(load_mailbox('sent'));
}

function view_email(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(data => {
    document.querySelector('#view-email').innerHTML = 
    `
      <div id = "header">
        <p><b>From:</b>&nbsp;${data.sender}</p>
        <p><b>To:</b>&nbsp;${data.recipients}</p>
        <p><b>Subject:</b>&nbsp;${data.subject}</p>
        <p><b>Timestamp</b>&nbsp;${data.timestamp}</p>
        <button class="btn btn-sm btn-outline-primary" id="Reply">Reply</button>
        <button class="btn btn-sm btn-outline-primary" id="Archive">Archive</button>
      </div>
      <p>${data.body}</p>
    `;

    if (data.archived)
    {
      document.querySelector('#Archive').innerHTML = 'Unarchive';
    }

    if (mailbox === 'sent')
    {
      document.querySelector('#Reply').style.display = 'none';
      document.querySelector('#Archive').style.display = 'none';
    }

    document.querySelector("#Reply").addEventListener('click', () => reply_to_email(data.id));

    fetch(`/emails/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
    .then(response => response.json())
    .then(
      document.querySelector("#Archive").addEventListener('click', () => {
        if (!data.archived)
        {
          fetch(`/emails/${data.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })
          .then(response => response.json())
          .then(load_mailbox("inbox"));
        }
        else
        {
          fetch(`/emails/${data.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          })
          .then(response => response.json())
          .then(load_mailbox("inbox"));
        }
      })
    );
    



  });
  
}

function reply_to_email(id) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(data => {
    document.querySelector('#compose-recipients').value = data.sender;
    document.querySelector('#compose-recipients').disabled = true;

    if (data.subject.length < 3 || data.subject.slice(0, 3) !== "Re:")
    {
      document.querySelector('#compose-subject').value = `Re: ${data.subject}`;
    }
    else
    {
      document.querySelector('#compose-subject').value = data.subject;
    }
    document.querySelector('#compose-subject').disabled = true;

    document.querySelector('#compose-body').value = `On ${data.timestamp} ${data.sender} wrote: ${data.body}`;
  }
  )
 
}