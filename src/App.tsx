import { AxiosError } from 'axios';
import { FormEvent, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';

import { api } from './services/api';

import './assets/styles/App.scss';

const URL_MATCHER =
  /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

export function App() {
  const [url, setUrl] = useState('');
  const [assertion, setAssertion] = useState('');
  const [error, setError] = useState('');
  const [inputError, setInputError] = useState<{
    url: string;
    assertion: string;
  }>({ url: '', assertion: '' });
  const [loading, setLoading] = useState(false);
  const [urlsStatus, setUrlsStatus] = useState<
    Array<{ url: string; status: 'CHECKING' | 'SUCCESS' | 'ERROR' }>
  >([]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);

    resetStates();

    const errors: { url: string; assertion: string } = {
      url: '',
      assertion: '',
    };

    if (!url) {
      errors.url = 'Please provide an url';
    }

    if (!assertion) {
      errors.assertion = 'Please provide an assertion';
    }

    if (Boolean(errors.url) || Boolean(errors.assertion)) {
      setInputErrorAndResetLoading(errors);
      return;
    }

    const urls = url.split(',');

    for await (const urlToTest of urls) {
      if (!URL_MATCHER.test(urlToTest.trim())) {
        setErrorAndResetLoading(
          `"${urlToTest}" is invalid. Please provide only valid urls!`
        );
        return;
      }

      setUrlsStatus(prevStatuses => [
        ...prevStatuses,
        { url: urlToTest, status: 'CHECKING' },
      ]);

      try {
        await pingUrlAndAssert(urlToTest);

        setUrlsStatus(prevStatuses => {
          const index = prevStatuses.findIndex(urls => urls.url === urlToTest);

          prevStatuses[index].status = 'SUCCESS';

          return [...prevStatuses];
        });
      } catch (err) {
        setUrlsStatus(prevStatuses => {
          const index = prevStatuses.findIndex(urls => urls.url === urlToTest);

          prevStatuses[index].status = 'ERROR';

          return [...prevStatuses];
        });
        setErrorAndResetLoading(
          (err as AxiosError).code === 'ERR_BAD_RESPONSE'
            ? `"${assertion}" not found on "${urlToTest}".`
            : `Check failed for "${urlToTest}", please try again.`
        );
        return;
      }
    }

    setLoading(false);
  }

  async function pingUrlAndAssert(urlToPing: string) {
    await api.post('url/ping', {
      url: urlToPing,
      assertion,
    });
  }

  function setErrorAndResetLoading(errorMessage: string) {
    setError(errorMessage);
    setLoading(false);
  }

  function setInputErrorAndResetLoading(inputError: {
    url: string;
    assertion: string;
  }) {
    setInputError({ ...inputError });
    setLoading(false);
  }

  function resetStates() {
    setError('');
    setInputError({
      url: '',
      assertion: '',
    });
    setUrlsStatus([]);
  }

  function renderIconByStatus(status: 'CHECKING' | 'SUCCESS' | 'ERROR') {
    const icons = {
      CHECKING: <FontAwesomeIcon icon={faSpinner} color="blue" spin />,
      SUCCESS: <FontAwesomeIcon icon={faCheck} color="green" />,
      ERROR: <FontAwesomeIcon icon={faXmark} color="red" />,
    };

    return icons[status];
  }

  return (
    <>
      <header>
        <div className="ping-app-header">
          <h1>Ping App</h1>
        </div>
      </header>
      <main className="ping-app">
        {error && (
          <div className="ping-app__error">
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="ping-app__input">
            <label htmlFor="url">Urls to ping</label>
            <textarea
              id="url"
              value={url}
              onChange={event => setUrl(event.target.value)}
              disabled={loading}
              rows={6}
            />
            {Boolean(inputError.url) && (
              <span className="ping-app__input-error">{inputError.url}</span>
            )}
          </div>
          <div className="ping-app__input">
            <label htmlFor="assertion">Assertion</label>
            <textarea
              id="assertion"
              value={assertion}
              onChange={event => setAssertion(event.target.value)}
              disabled={loading}
              rows={6}
            />
            {Boolean(inputError.assertion) && (
              <span className="ping-app__input-error">
                {inputError.assertion}
              </span>
            )}
          </div>
          <button disabled={loading}>Ping</button>
        </form>

        <section>
          {urlsStatus.map(urlStatus => (
            <div key={urlStatus.url} className="ping-app__status-container">
              <p>{urlStatus.url}</p>
              <span>{renderIconByStatus(urlStatus.status)}</span>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
