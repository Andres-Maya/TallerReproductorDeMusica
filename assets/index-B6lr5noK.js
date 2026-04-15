(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class e{static{this.STORAGE_KEY=`waveline_session`}static{this.DEFAULT_EXPIRATION_HOURS=24}static{this.REMEMBER_ME_EXPIRATION_DAYS=30}saveSession(t,n){let r=n?e.REMEMBER_ME_EXPIRATION_DAYS*24*60*60*1e3:e.DEFAULT_EXPIRATION_HOURS*60*60*1e3,i=new Date(Date.now()+r).toISOString(),a={...t,expiresAt:i},o=this.encodeSession(a);try{localStorage.setItem(e.STORAGE_KEY,o)}catch(e){throw console.error(`Failed to save session to localStorage:`,e),Error(`Unable to save session. Please check your browser settings.`)}}loadSession(){try{let t=localStorage.getItem(e.STORAGE_KEY);if(!t)return null;let n=this.decodeSession(t);return this.isValidSessionData(n)?this.isSessionValidInternal(n)?n:(console.info(`Session has expired, clearing session`),this.clearSession(),null):(console.warn(`Invalid session data structure, clearing session`),this.clearSession(),null)}catch(e){return console.error(`Failed to load session from localStorage:`,e),this.clearSession(),null}}clearSession(){try{localStorage.removeItem(e.STORAGE_KEY)}catch(e){console.error(`Failed to clear session from localStorage:`,e)}}isSessionValid(){let e=this.loadSession();return e!==null&&this.isSessionValidInternal(e)}getToken(){let e=this.loadSession();return e?e.token:null}encodeSession(e){let t=JSON.stringify(e);return btoa(t)}decodeSession(e){let t=atob(e);return JSON.parse(t)}isValidSessionData(e){if(!e||typeof e!=`object`)return!1;let t=e;return typeof t.token==`string`&&typeof t.userId==`string`&&typeof t.username==`string`&&typeof t.expiresAt==`string`}isSessionValidInternal(e){return new Date(e.expiresAt)>new Date}},t=class{constructor(){this.state={user:null,playlists:[],currentPlaylist:null,playbackState:null,isLoading:!1,error:null},this.listeners=new Set}getState(){return Object.freeze({...this.state})}setState(e){this.state={...this.state,...e},this.notifyListeners()}subscribe(e){return this.listeners.add(e),()=>{this.listeners.delete(e)}}unsubscribe(e){this.listeners.delete(e)}setUser(e){this.setState({user:e,error:null})}clearUser(){this.setState({user:null,playlists:[],currentPlaylist:null,playbackState:null,error:null})}setPlaylists(e){this.setState({playlists:e,error:null})}setCurrentPlaylist(e){this.setState({currentPlaylist:e,error:null})}setPlaybackState(e){this.setState({playbackState:e,error:null})}setError(e){this.setState({error:e,isLoading:!1})}clearError(){this.setState({error:null})}setLoading(e){this.setState({isLoading:e})}notifyListeners(){let e=this.getState();this.listeners.forEach(t=>{try{t(e)}catch(e){console.error(`Error in state listener:`,e)}})}},n=class{constructor(e){this.apiClient=e}async register(e,t){let n={username:e,password:t};return this.apiClient.post(`/api/v1/auth/register`,n)}async login(e,t,n=!1){let r={username:e,password:t,rememberMe:n};return this.apiClient.post(`/api/v1/auth/login`,r)}async logout(){await this.apiClient.post(`/api/v1/auth/logout`,{})}async getCurrentUser(){return this.apiClient.get(`/api/v1/auth/me`)}},r=class{constructor(e){this.apiClient=e}async getPlaylists(){return this.apiClient.get(`/api/v1/playlists`)}async createPlaylist(e){let t={name:e};return this.apiClient.post(`/api/v1/playlists`,t)}async getPlaylist(e){return this.apiClient.get(`/api/v1/playlists/${e}`)}async updatePlaylist(e,t){let n={name:t};return this.apiClient.put(`/api/v1/playlists/${e}`,n)}async deletePlaylist(e){await this.apiClient.delete(`/api/v1/playlists/${e}`)}async addSong(e,t){return this.apiClient.post(`/api/v1/playlists/${e}/songs`,t)}async removeSong(e,t){await this.apiClient.delete(`/api/v1/playlists/${e}/songs/${t}`)}async getSongs(e){return this.apiClient.get(`/api/v1/playlists/${e}/songs`)}async moveSong(e,t,n){await this.apiClient.put(`/api/v1/playlists/${e}/songs/${t}/position`,{newPosition:n})}},i=class{constructor(e){this.apiClient=e,this.baseUrl=e.baseUrl||`http://localhost:4000`}async uploadFile(e){let{file:t,playlistId:n,onProgress:r}=e,i=new FormData;return i.append(`file`,t),i.append(`playlistId`,n),new Promise((e,t)=>{let n=new XMLHttpRequest;r&&n.upload.addEventListener(`progress`,e=>{e.lengthComputable&&r(Math.round(e.loaded/e.total*100))}),n.addEventListener(`load`,()=>{if(n.status>=200&&n.status<300)try{e(JSON.parse(n.responseText))}catch{t(Error(`Failed to parse response`))}else try{let e=JSON.parse(n.responseText);t(Error(e.error||e.message||`Upload failed`))}catch{t(Error(`Upload failed with status ${n.status}`))}}),n.addEventListener(`error`,()=>{t(Error(`Network error during upload`))}),n.addEventListener(`abort`,()=>{t(Error(`Upload cancelled`))});let a=this.apiClient.token;n.open(`POST`,`${this.baseUrl}/api/v1/upload`),a&&n.setRequestHeader(`Authorization`,`Bearer ${a}`),n.send(i)})}async getStorageQuota(){return this.apiClient.get(`/api/v1/storage/quota`)}async deleteFile(e){await this.apiClient.delete(`/api/v1/files/${e}`)}},a=class{constructor(e){this.apiClient=e,this.baseUrl=e.baseUrl||`http://localhost:4000`}async getPreview(e){return this.apiClient.post(`/api/v1/youtube/preview`,e)}async extractAudio(e,t){let n=this.apiClient.post(`/api/v1/youtube/extract`,e);if(t){let e=setInterval(()=>{t(Math.min(90,Math.random()*100))},1e3);try{let r=await n;return clearInterval(e),t(100),r}catch(t){throw clearInterval(e),t}}return n}},o=class e extends Error{constructor(t,n,r){super(t),this.name=`ApiError`,this.statusCode=n,this.errors=r,Error.captureStackTrace&&Error.captureStackTrace(this,e)}},s=class{constructor(e){this.token=null,this.maxRetries=3,this.retryDelay=1e3;let t=e||`http://localhost:4000`;this.baseUrl=t.endsWith(`/`)?t.slice(0,-1):t}setAuthToken(e){this.token=e}clearAuthToken(){this.token=null}async get(e){return this.request(`GET`,e)}async post(e,t){return this.request(`POST`,e,t)}async put(e,t){return this.request(`PUT`,e,t)}async delete(e){return this.request(`DELETE`,e)}async request(e,t,n,r=1){let i=`${this.baseUrl}${t.startsWith(`/`)?t:`/`+t}`,a={"Content-Type":`application/json`};this.token&&(a.Authorization=`Bearer ${this.token}`);let s={method:e,headers:a};n&&(e===`POST`||e===`PUT`)&&(s.body=JSON.stringify(n));try{let e=await fetch(i,s);if(e.status===401)throw this.dispatchAuthExpiredEvent(),new o(`Your session has expired. Please log in again.`,401);return e.ok||await this.handleErrorResponse(e),e.status===204?void 0:await e.json()}catch(i){if(i instanceof o)throw i;if(i instanceof TypeError&&i.message.includes(`fetch`)){if(r<this.maxRetries)return await this.delay(this.retryDelay*r),this.request(e,t,n,r+1);throw new o(`Unable to connect to the server. Please check your internet connection and try again.`,0)}throw new o(`An unexpected error occurred. Please try again.`,0)}}async handleErrorResponse(e){let t=`An error occurred`,n;try{let r=await e.json();t=r.message||r.error||t,n=r.errors}catch{t=e.statusText||t}throw new o(t,e.status,n)}dispatchAuthExpiredEvent(){let e=new CustomEvent(`auth:expired`,{detail:{message:`Authentication token has expired`}});window.dispatchEvent(e)}delay(e){return new Promise(t=>setTimeout(t,e))}},c=class{constructor(e,t,n,r,i){this.container=e,this.authApi=t,this.sessionManager=n,this.stateManager=r,this.onSuccess=i,this.state={username:``,password:``,rememberMe:!1,isLoading:!1,errors:{}},this.render(),this.attachEventListeners()}render(){this.container.innerHTML=`
      <div class="login-form-container">
        <div class="login-form-card">
          <h2 class="login-form-title">Welcome to Waveline</h2>
          <p class="login-form-subtitle">Sign in to access your playlists</p>
          
          <form id="login-form" class="login-form" novalidate>
            ${this.state.errors.general?`
              <div class="form-error-general">
                ${this.escapeHtml(this.state.errors.general)}
              </div>
            `:``}
            
            <div class="form-group">
              <label for="username" class="form-label">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                class="form-input ${this.state.errors.username?`form-input-error`:``}"
                value="${this.escapeHtml(this.state.username)}"
                placeholder="Enter your username"
                autocomplete="username"
                ${this.state.isLoading?`disabled`:``}
                required
              />
              ${this.state.errors.username?`
                <div class="form-error">${this.escapeHtml(this.state.errors.username)}</div>
              `:``}
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input ${this.state.errors.password?`form-input-error`:``}"
                value="${this.escapeHtml(this.state.password)}"
                placeholder="Enter your password"
                autocomplete="current-password"
                ${this.state.isLoading?`disabled`:``}
                required
              />
              ${this.state.errors.password?`
                <div class="form-error">${this.escapeHtml(this.state.errors.password)}</div>
              `:``}
            </div>
            
            <div class="form-group-checkbox">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  class="form-checkbox"
                  ${this.state.rememberMe?`checked`:``}
                  ${this.state.isLoading?`disabled`:``}
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>
            
            <button
              type="submit"
              class="form-submit-btn"
              ${this.state.isLoading?`disabled`:``}
            >
              ${this.state.isLoading?`Signing in...`:`Sign In`}
            </button>
          </form>
          
          <div class="login-form-footer">
            <p>Don't have an account? <a href="#" id="register-link">Register here</a></p>
          </div>
        </div>
      </div>
    `,this.addStyles()}attachEventListeners(){let e=this.container.querySelector(`#login-form`),t=this.container.querySelector(`#username`),n=this.container.querySelector(`#password`),r=this.container.querySelector(`#rememberMe`);if(!e||!t||!n||!r){console.error(`LoginForm: Required form elements not found`);return}e.addEventListener(`submit`,e=>this.handleSubmit(e)),t.addEventListener(`input`,()=>{this.state.username=t.value,this.clearFieldError(`username`),this.clearFieldError(`general`)}),n.addEventListener(`input`,()=>{this.state.password=n.value,this.clearFieldError(`password`),this.clearFieldError(`general`)}),r.addEventListener(`change`,()=>{this.state.rememberMe=r.checked})}async handleSubmit(e){if(e.preventDefault(),this.state.errors={},!this.validateForm()){this.render(),this.attachEventListeners();return}this.updateState({isLoading:!0});try{let e=await this.authApi.login(this.state.username,this.state.password,this.state.rememberMe);this.sessionManager.saveSession({token:e.token,userId:e.user.id,username:e.user.username,expiresAt:e.expiresAt},this.state.rememberMe),this.stateManager.setUser({id:e.user.id,username:e.user.username}),this.onSuccess&&this.onSuccess()}catch(e){this.handleLoginError(e)}finally{this.updateState({isLoading:!1})}}validateForm(){let e={};return this.state.username.trim()||(e.username=`Username is required`),this.state.password||(e.password=`Password is required`),this.state.errors=e,Object.keys(e).length===0}handleLoginError(e){if(e&&typeof e==`object`&&`statusCode`in e){let t=e;t.statusCode===401?this.state.errors.general=`Invalid username or password`:t.statusCode===0?this.state.errors.general=`Unable to connect to server. Please try again.`:this.state.errors.general=t.message||`An error occurred. Please try again.`}else this.state.errors.general=`An unexpected error occurred. Please try again.`;this.render(),this.attachEventListeners()}clearFieldError(e){this.state.errors[e]&&(delete this.state.errors[e],this.updateErrorDisplay(e))}updateErrorDisplay(e){let t=this.container.querySelector(e===`general`?`.form-error-general`:`#${e} + .form-error, #${e}.form-input-error`);if(t)if(e===`general`)t.remove();else{let t=this.container.querySelector(`#${e}`);t&&t.classList.remove(`form-input-error`);let n=this.container.querySelector(`#${e} ~ .form-error`);n&&n.remove()}}updateState(e){this.state={...this.state,...e},this.render(),this.attachEventListeners()}escapeHtml(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}addStyles(){if(document.getElementById(`login-form-styles`))return;let e=document.createElement(`style`);e.id=`login-form-styles`,e.textContent=`
      .login-form-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }

      .login-form-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        padding: 2.5rem;
        width: 100%;
        max-width: 420px;
      }

      .login-form-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a202c;
        text-align: center;
      }

      .login-form-subtitle {
        margin: 0 0 2rem 0;
        font-size: 0.95rem;
        color: #718096;
        text-align: center;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .form-error-general {
        padding: 0.75rem 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #2d3748;
      }

      .form-input {
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        transition: all 0.2s;
        outline: none;
      }

      .form-input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .form-input:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-input-error {
        border-color: #fc8181;
      }

      .form-input-error:focus {
        border-color: #f56565;
        box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
      }

      .form-error {
        font-size: 0.85rem;
        color: #e53e3e;
        margin-top: -0.25rem;
      }

      .form-group-checkbox {
        display: flex;
        align-items: center;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #4a5568;
        cursor: pointer;
        user-select: none;
      }

      .form-checkbox {
        width: 1.1rem;
        height: 1.1rem;
        cursor: pointer;
      }

      .form-checkbox:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-submit-btn {
        padding: 0.875rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 0.5rem;
      }

      .form-submit-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .form-submit-btn:active:not(:disabled) {
        transform: translateY(0);
      }

      .form-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .login-form-footer {
        margin-top: 1.5rem;
        text-align: center;
        font-size: 0.9rem;
        color: #718096;
      }

      .login-form-footer a {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
      }

      .login-form-footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 480px) {
        .login-form-card {
          padding: 2rem 1.5rem;
        }

        .login-form-title {
          font-size: 1.5rem;
        }
      }
    `,document.head.appendChild(e)}destroy(){this.container.innerHTML=``}},l=class{constructor(e,t,n,r,i){this.container=e,this.authApi=t,this.sessionManager=n,this.stateManager=r,this.onSuccess=i,this.state={username:``,password:``,isLoading:!1,errors:{},passwordStrength:null},this.render(),this.attachEventListeners()}render(){this.container.innerHTML=`
      <div class="register-form-container">
        <div class="register-form-card">
          <h2 class="register-form-title">Join Waveline</h2>
          <p class="register-form-subtitle">Create your account to start building playlists</p>
          
          <form id="register-form" class="register-form" novalidate>
            ${this.state.errors.general?`
              <div class="form-error-general">
                ${this.escapeHtml(this.state.errors.general)}
              </div>
            `:``}
            
            <div class="form-group">
              <label for="username" class="form-label">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                class="form-input ${this.state.errors.username?`form-input-error`:``}"
                value="${this.escapeHtml(this.state.username)}"
                placeholder="Choose a username"
                autocomplete="username"
                ${this.state.isLoading?`disabled`:``}
                required
              />
              ${this.state.errors.username?`
                <div class="form-error">${this.escapeHtml(this.state.errors.username)}</div>
              `:``}
              <div class="form-hint">3-30 characters, letters, numbers, and underscores only</div>
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input ${this.state.errors.password?`form-input-error`:``}"
                value="${this.escapeHtml(this.state.password)}"
                placeholder="Create a strong password"
                autocomplete="new-password"
                ${this.state.isLoading?`disabled`:``}
                required
              />
              ${this.state.errors.password?`
                <div class="form-error">${this.escapeHtml(this.state.errors.password)}</div>
              `:``}
              ${this.state.passwordStrength?`
                <div class="password-strength">
                  <div class="password-strength-label">Password strength:</div>
                  <div class="password-strength-bar">
                    <div class="password-strength-fill password-strength-${this.state.passwordStrength}"></div>
                  </div>
                  <div class="password-strength-text password-strength-text-${this.state.passwordStrength}">
                    ${this.state.passwordStrength.charAt(0).toUpperCase()+this.state.passwordStrength.slice(1)}
                  </div>
                </div>
              `:``}
              <div class="form-hint">Minimum 8 characters with uppercase, lowercase, and number</div>
            </div>
            
            <button
              type="submit"
              class="form-submit-btn"
              ${this.state.isLoading?`disabled`:``}
            >
              ${this.state.isLoading?`Creating account...`:`Create Account`}
            </button>
          </form>
          
          <div class="register-form-footer">
            <p>Already have an account? <a href="#" id="login-link">Sign in here</a></p>
          </div>
        </div>
      </div>
    `,this.addStyles()}attachEventListeners(){let e=this.container.querySelector(`#register-form`),t=this.container.querySelector(`#username`),n=this.container.querySelector(`#password`);if(!e||!t||!n){console.error(`RegisterForm: Required form elements not found`);return}e.addEventListener(`submit`,e=>this.handleSubmit(e)),t.addEventListener(`input`,()=>{this.state.username=t.value,this.clearFieldError(`username`),this.clearFieldError(`general`)}),n.addEventListener(`input`,()=>{this.state.password=n.value,this.clearFieldError(`password`),this.clearFieldError(`general`),this.updatePasswordStrength()})}async handleSubmit(e){if(e.preventDefault(),this.state.errors={},!this.validateForm()){this.render(),this.attachEventListeners();return}this.updateState({isLoading:!0});try{let e=await this.authApi.register(this.state.username,this.state.password);this.sessionManager.saveSession({token:e.token,userId:e.user.id,username:e.user.username,expiresAt:e.expiresAt},!1),this.stateManager.setUser({id:e.user.id,username:e.user.username}),this.onSuccess&&this.onSuccess()}catch(e){this.handleRegisterError(e)}finally{this.updateState({isLoading:!1})}}validateForm(){let e={};this.state.username.trim()?this.state.username.length<3?e.username=`Username must be at least 3 characters`:this.state.username.length>30?e.username=`Username must be at most 30 characters`:/^[a-zA-Z0-9_]+$/.test(this.state.username)||(e.username=`Username can only contain letters, numbers, and underscores`):e.username=`Username is required`;let t=this.validatePassword(this.state.password);return t.isValid||(e.password=t.error||`Invalid password`),this.state.errors=e,Object.keys(e).length===0}validatePassword(e){return e?e.length<8?{isValid:!1,error:`Password must be at least 8 characters`}:/[A-Z]/.test(e)?/[a-z]/.test(e)?/[0-9]/.test(e)?{isValid:!0}:{isValid:!1,error:`Password must contain at least one number`}:{isValid:!1,error:`Password must contain at least one lowercase letter`}:{isValid:!1,error:`Password must contain at least one uppercase letter`}:{isValid:!1,error:`Password is required`}}calculatePasswordStrength(e){if(!e)return null;let t=0;return e.length>=8&&t++,e.length>=12&&t++,/[a-z]/.test(e)&&t++,/[A-Z]/.test(e)&&t++,/[0-9]/.test(e)&&t++,/[^a-zA-Z0-9]/.test(e)&&t++,t<=2?`weak`:t<=4?`medium`:`strong`}updatePasswordStrength(){let e=this.calculatePasswordStrength(this.state.password);e!==this.state.passwordStrength&&(this.state.passwordStrength=e,this.render(),this.attachEventListeners())}handleRegisterError(e){if(e&&typeof e==`object`&&`statusCode`in e){let t=e;t.statusCode===409?this.state.errors.username=`Username is already taken`:t.statusCode===400?t.message.toLowerCase().includes(`password`)?this.state.errors.password=t.message:t.message.toLowerCase().includes(`username`)?this.state.errors.username=t.message:this.state.errors.general=t.message:t.statusCode===0?this.state.errors.general=`Unable to connect to server. Please try again.`:this.state.errors.general=t.message||`An error occurred. Please try again.`}else this.state.errors.general=`An unexpected error occurred. Please try again.`;this.render(),this.attachEventListeners()}clearFieldError(e){this.state.errors[e]&&(delete this.state.errors[e],this.updateErrorDisplay(e))}updateErrorDisplay(e){let t=this.container.querySelector(e===`general`?`.form-error-general`:`#${e} + .form-error, #${e}.form-input-error`);if(t)if(e===`general`)t.remove();else{let t=this.container.querySelector(`#${e}`);t&&t.classList.remove(`form-input-error`);let n=this.container.querySelector(`#${e} ~ .form-error`);n&&n.remove()}}updateState(e){this.state={...this.state,...e},this.render(),this.attachEventListeners()}escapeHtml(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}addStyles(){if(document.getElementById(`register-form-styles`))return;let e=document.createElement(`style`);e.id=`register-form-styles`,e.textContent=`
      .register-form-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }

      .register-form-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        padding: 2.5rem;
        width: 100%;
        max-width: 420px;
      }

      .register-form-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a202c;
        text-align: center;
      }

      .register-form-subtitle {
        margin: 0 0 2rem 0;
        font-size: 0.95rem;
        color: #718096;
        text-align: center;
      }

      .register-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .form-error-general {
        padding: 0.75rem 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #2d3748;
      }

      .form-input {
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        transition: all 0.2s;
        outline: none;
      }

      .form-input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .form-input:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-input-error {
        border-color: #fc8181;
      }

      .form-input-error:focus {
        border-color: #f56565;
        box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
      }

      .form-error {
        font-size: 0.85rem;
        color: #e53e3e;
        margin-top: -0.25rem;
      }

      .form-hint {
        font-size: 0.8rem;
        color: #a0aec0;
        margin-top: -0.25rem;
      }

      .password-strength {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.25rem;
      }

      .password-strength-label {
        font-size: 0.8rem;
        color: #4a5568;
        white-space: nowrap;
      }

      .password-strength-bar {
        flex: 1;
        height: 6px;
        background-color: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .password-strength-fill {
        height: 100%;
        transition: all 0.3s ease;
        border-radius: 3px;
      }

      .password-strength-fill.password-strength-weak {
        width: 33%;
        background-color: #fc8181;
      }

      .password-strength-fill.password-strength-medium {
        width: 66%;
        background-color: #f6ad55;
      }

      .password-strength-fill.password-strength-strong {
        width: 100%;
        background-color: #68d391;
      }

      .password-strength-text {
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .password-strength-text-weak {
        color: #e53e3e;
      }

      .password-strength-text-medium {
        color: #dd6b20;
      }

      .password-strength-text-strong {
        color: #38a169;
      }

      .form-submit-btn {
        padding: 0.875rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 0.5rem;
      }

      .form-submit-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .form-submit-btn:active:not(:disabled) {
        transform: translateY(0);
      }

      .form-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .register-form-footer {
        margin-top: 1.5rem;
        text-align: center;
        font-size: 0.9rem;
        color: #718096;
      }

      .register-form-footer a {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
      }

      .register-form-footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 480px) {
        .register-form-card {
          padding: 2rem 1.5rem;
        }

        .register-form-title {
          font-size: 1.5rem;
        }
      }
    `,document.head.appendChild(e)}destroy(){this.container.innerHTML=``}},u=class{constructor(e,t,n){this.container=e,this.playlistApi=t,this.stateManager=n,this.state={isLoading:!1,isCreatingPlaylist:!1,isAddingSong:!1,showNewPlaylistModal:!1,showAddSongModal:!1,showDeleteConfirmModal:!1,newPlaylistName:``,newSong:{title:``,artist:``,audioUrl:``},playlistToDelete:null,errors:{},songs:[]},this.unsubscribe=this.stateManager.subscribe(e=>{this.handleStateChange(e)}),this.render(),this.attachEventListeners(),this.loadPlaylists()}handleStateChange(e){this.render(),this.attachEventListeners(),e.currentPlaylist&&this.loadSongs(e.currentPlaylist)}async loadPlaylists(){this.updateState({isLoading:!0,errors:{}});try{let e=await this.playlistApi.getPlaylists();this.stateManager.setPlaylists(e)}catch(e){this.handleError(e,`Failed to load playlists`)}finally{this.updateState({isLoading:!1})}}async loadSongs(e){try{let t=await this.playlistApi.getSongs(e);this.updateState({songs:t})}catch(e){this.handleError(e,`Failed to load songs`)}}async createPlaylist(){if(!this.state.newPlaylistName.trim()){this.updateState({errors:{...this.state.errors,newPlaylist:`Playlist name is required`}});return}this.updateState({isCreatingPlaylist:!0,errors:{}});try{let e=await this.playlistApi.createPlaylist(this.state.newPlaylistName.trim()),t=this.stateManager.getState();this.stateManager.setPlaylists([...t.playlists,e]),this.updateState({showNewPlaylistModal:!1,newPlaylistName:``,isCreatingPlaylist:!1})}catch(e){this.handleError(e,`Failed to create playlist`,`newPlaylist`),this.updateState({isCreatingPlaylist:!1})}}selectPlaylist(e){this.stateManager.setCurrentPlaylist(e)}async addSong(){let e=this.stateManager.getState();if(!e.currentPlaylist){this.updateState({errors:{...this.state.errors,addSong:`Please select a playlist first`}});return}if(!this.state.newSong.title.trim()){this.updateState({errors:{...this.state.errors,addSong:`Song title is required`}});return}if(!this.state.newSong.artist.trim()){this.updateState({errors:{...this.state.errors,addSong:`Artist name is required`}});return}if(!this.state.newSong.audioUrl.trim()){this.updateState({errors:{...this.state.errors,addSong:`Audio URL is required`}});return}try{new URL(this.state.newSong.audioUrl)}catch{this.updateState({errors:{...this.state.errors,addSong:`Audio URL must be a valid URL`}});return}let t=this.state.newSong.title.trim();if(this.state.songs.some(e=>e.title.toLowerCase()===t.toLowerCase())){this.updateState({errors:{...this.state.errors,addSong:`A song with this title already exists in the playlist`}});return}this.updateState({isAddingSong:!0,errors:{}});try{let t=await this.playlistApi.addSong(e.currentPlaylist,{title:this.state.newSong.title.trim(),artist:this.state.newSong.artist.trim(),audioUrl:this.state.newSong.audioUrl.trim()});this.updateState({songs:[...this.state.songs,t],showAddSongModal:!1,newSong:{title:``,artist:``,audioUrl:``},isAddingSong:!1})}catch(e){this.handleError(e,`Failed to add song`,`addSong`),this.updateState({isAddingSong:!1})}}async deletePlaylist(e){this.updateState({isLoading:!0,errors:{}});try{await this.playlistApi.deletePlaylist(e);let t=this.stateManager.getState(),n=t.playlists.filter(t=>t.id!==e);this.stateManager.setPlaylists(n),t.currentPlaylist===e&&(this.stateManager.setCurrentPlaylist(``),this.updateState({songs:[]})),this.updateState({showDeleteConfirmModal:!1,playlistToDelete:null,isLoading:!1})}catch(e){this.handleError(e,`Failed to delete playlist`),this.updateState({isLoading:!1})}}render(){let e=this.stateManager.getState(),t=e.playlists.find(t=>t.id===e.currentPlaylist);this.container.innerHTML=`
      <div class="playlist-view-container">
        <div class="playlist-view-header">
          <h1 class="playlist-view-title">My Playlists</h1>
          <button id="new-playlist-btn" class="btn-primary">
            + New Playlist
          </button>
        </div>

        ${this.state.errors.general?`
          <div class="error-message">
            ${this.escapeHtml(this.state.errors.general)}
          </div>
        `:``}

        <div class="playlist-view-content">
          <!-- Playlists List -->
          <div class="playlists-section">
            <h2 class="section-title">Playlists</h2>
            ${this.state.isLoading?`
              <div class="loading-message">Loading playlists...</div>
            `:e.playlists.length===0?`
              <div class="empty-message">
                No playlists yet. Create your first playlist!
              </div>
            `:`
              <ul class="playlists-list">
                ${e.playlists.map(t=>`
                  <li class="playlist-item ${t.id===e.currentPlaylist?`playlist-item-active`:``}"
                      data-playlist-id="${t.id}">
                    <div class="playlist-info">
                      <div class="playlist-name">${this.escapeHtml(t.name)}</div>
                      <div class="playlist-meta">${t.songCount||0} songs</div>
                    </div>
                    <button class="btn-delete-playlist" data-playlist-id="${t.id}" title="Delete playlist">
                      🗑️
                    </button>
                  </li>
                `).join(``)}
              </ul>
            `}
          </div>

          <!-- Songs List -->
          <div class="songs-section">
            ${t?`
              <div class="songs-header">
                <h2 class="section-title">${this.escapeHtml(t.name)}</h2>
                <button id="add-song-btn" class="btn-secondary">
                  + Add Song
                </button>
              </div>
              ${this.state.songs.length===0?`
                <div class="empty-message">
                  No songs in this playlist. Add your first song!
                </div>
              `:`
                <ul class="songs-list">
                  ${this.state.songs.map((e,t)=>`
                    <li class="song-item" data-song-id="${e.id}" data-song-index="${t}">
                      <div class="song-info">
                        <div class="song-title">${this.escapeHtml(e.title)}</div>
                        <div class="song-artist">${this.escapeHtml(e.artist)}</div>
                      </div>
                      <div class="song-actions">
                        <button 
                          class="btn-move-song btn-move-up" 
                          data-song-id="${e.id}" 
                          data-song-index="${t}"
                          ${t===0?`disabled`:``}
                          title="Move up">
                          ⬆️
                        </button>
                        <button 
                          class="btn-move-song btn-move-down" 
                          data-song-id="${e.id}" 
                          data-song-index="${t}"
                          ${t===this.state.songs.length-1?`disabled`:``}
                          title="Move down">
                          ⬇️
                        </button>
                      </div>
                    </li>
                  `).join(``)}
                </ul>
              `}
            `:`
              <div class="empty-message">
                Select a playlist to view its songs
              </div>
            `}
          </div>
        </div>

        <!-- New Playlist Modal -->
        ${this.state.showNewPlaylistModal?`
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3 class="modal-title">Create New Playlist</h3>
                <button class="modal-close" id="close-new-playlist-modal">&times;</button>
              </div>
              <div class="modal-body">
                ${this.state.errors.newPlaylist?`
                  <div class="form-error-general">
                    ${this.escapeHtml(this.state.errors.newPlaylist)}
                  </div>
                `:``}
                <div class="form-group">
                  <label for="playlist-name" class="form-label">Playlist Name</label>
                  <input
                    type="text"
                    id="playlist-name"
                    class="form-input"
                    value="${this.escapeHtml(this.state.newPlaylistName)}"
                    placeholder="Enter playlist name"
                    ${this.state.isCreatingPlaylist?`disabled`:``}
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" id="cancel-new-playlist" ${this.state.isCreatingPlaylist?`disabled`:``}>
                  Cancel
                </button>
                <button class="btn-primary" id="create-playlist-btn" ${this.state.isCreatingPlaylist?`disabled`:``}>
                  ${this.state.isCreatingPlaylist?`Creating...`:`Create`}
                </button>
              </div>
            </div>
          </div>
        `:``}

        <!-- Add Song Modal -->
        ${this.state.showAddSongModal?`
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3 class="modal-title">Add Song</h3>
                <button class="modal-close" id="close-add-song-modal">&times;</button>
              </div>
              <div class="modal-body">
                ${this.state.errors.addSong?`
                  <div class="form-error-general">
                    ${this.escapeHtml(this.state.errors.addSong)}
                  </div>
                `:``}
                <div class="form-group">
                  <label for="song-title" class="form-label">Title</label>
                  <input
                    type="text"
                    id="song-title"
                    class="form-input"
                    value="${this.escapeHtml(this.state.newSong.title)}"
                    placeholder="Enter song title"
                    ${this.state.isAddingSong?`disabled`:``}
                  />
                </div>
                <div class="form-group">
                  <label for="song-artist" class="form-label">Artist</label>
                  <input
                    type="text"
                    id="song-artist"
                    class="form-input"
                    value="${this.escapeHtml(this.state.newSong.artist)}"
                    placeholder="Enter artist name"
                    ${this.state.isAddingSong?`disabled`:``}
                  />
                </div>
                <div class="form-group">
                  <label for="song-url" class="form-label">Audio URL</label>
                  <input
                    type="url"
                    id="song-url"
                    class="form-input"
                    value="${this.escapeHtml(this.state.newSong.audioUrl)}"
                    placeholder="https://example.com/song.mp3"
                    ${this.state.isAddingSong?`disabled`:``}
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" id="cancel-add-song" ${this.state.isAddingSong?`disabled`:``}>
                  Cancel
                </button>
                <button class="btn-primary" id="add-song-submit-btn" ${this.state.isAddingSong?`disabled`:``}>
                  ${this.state.isAddingSong?`Adding...`:`Add Song`}
                </button>
              </div>
            </div>
          </div>
        `:``}

        <!-- Delete Confirmation Modal -->
        ${this.state.showDeleteConfirmModal&&this.state.playlistToDelete?`
          <div class="modal-overlay">
            <div class="modal modal-small">
              <div class="modal-header">
                <h3 class="modal-title">Delete Playlist</h3>
                <button class="modal-close" id="close-delete-modal">&times;</button>
              </div>
              <div class="modal-body">
                <p>Are you sure you want to delete this playlist? This action cannot be undone.</p>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" id="cancel-delete">
                  Cancel
                </button>
                <button class="btn-danger" id="confirm-delete-btn">
                  Delete
                </button>
              </div>
            </div>
          </div>
        `:``}
      </div>
    `,this.addStyles()}attachEventListeners(){this.container.querySelector(`#new-playlist-btn`)?.addEventListener(`click`,()=>{this.updateState({showNewPlaylistModal:!0,newPlaylistName:``,errors:{}})}),this.container.querySelectorAll(`.playlist-item`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.target.classList.contains(`btn-delete-playlist`))return;let n=e.dataset.playlistId;n&&this.selectPlaylist(n)})}),this.container.querySelectorAll(`.btn-delete-playlist`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=e.dataset.playlistId;n&&this.updateState({showDeleteConfirmModal:!0,playlistToDelete:n})})}),this.container.querySelector(`#add-song-btn`)?.addEventListener(`click`,()=>{this.updateState({showAddSongModal:!0,newSong:{title:``,artist:``,audioUrl:``},errors:{}})}),this.attachNewPlaylistModalListeners(),this.attachAddSongModalListeners(),this.attachDeleteModalListeners(),this.attachSongClickListeners(),this.attachMoveSongListeners()}attachNewPlaylistModalListeners(){let e=this.container.querySelector(`#playlist-name`),t=this.container.querySelector(`#create-playlist-btn`),n=this.container.querySelector(`#cancel-new-playlist`),r=this.container.querySelector(`#close-new-playlist-modal`);e?.addEventListener(`input`,()=>{this.state.newPlaylistName=e.value,this.state.errors.newPlaylist&&this.updateState({errors:{...this.state.errors,newPlaylist:void 0}})}),t?.addEventListener(`click`,()=>{this.createPlaylist()}),n?.addEventListener(`click`,()=>{this.updateState({showNewPlaylistModal:!1,newPlaylistName:``,errors:{}})}),r?.addEventListener(`click`,()=>{this.updateState({showNewPlaylistModal:!1,newPlaylistName:``,errors:{}})})}attachAddSongModalListeners(){let e=this.container.querySelector(`#song-title`),t=this.container.querySelector(`#song-artist`),n=this.container.querySelector(`#song-url`),r=this.container.querySelector(`#add-song-submit-btn`),i=this.container.querySelector(`#cancel-add-song`),a=this.container.querySelector(`#close-add-song-modal`);e?.addEventListener(`input`,()=>{this.state.newSong.title=e.value,this.state.errors.addSong&&this.updateState({errors:{...this.state.errors,addSong:void 0}})}),t?.addEventListener(`input`,()=>{this.state.newSong.artist=t.value,this.state.errors.addSong&&this.updateState({errors:{...this.state.errors,addSong:void 0}})}),n?.addEventListener(`input`,()=>{this.state.newSong.audioUrl=n.value,this.state.errors.addSong&&this.updateState({errors:{...this.state.errors,addSong:void 0}})}),r?.addEventListener(`click`,()=>{this.addSong()}),i?.addEventListener(`click`,()=>{this.updateState({showAddSongModal:!1,newSong:{title:``,artist:``,audioUrl:``},errors:{}})}),a?.addEventListener(`click`,()=>{this.updateState({showAddSongModal:!1,newSong:{title:``,artist:``,audioUrl:``},errors:{}})})}attachDeleteModalListeners(){let e=this.container.querySelector(`#confirm-delete-btn`),t=this.container.querySelector(`#cancel-delete`),n=this.container.querySelector(`#close-delete-modal`);e?.addEventListener(`click`,()=>{this.state.playlistToDelete&&this.deletePlaylist(this.state.playlistToDelete)}),t?.addEventListener(`click`,()=>{this.updateState({showDeleteConfirmModal:!1,playlistToDelete:null})}),n?.addEventListener(`click`,()=>{this.updateState({showDeleteConfirmModal:!1,playlistToDelete:null})})}attachSongClickListeners(){this.container.querySelectorAll(`.song-item`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.songId,n=parseInt(e.dataset.songIndex||`0`,10);t&&this.playSong(t,n)})})}playSong(e,t){let n=this.stateManager.getState(),r=n.playlists.find(e=>e.id===n.currentPlaylist);if(!r)return;let i=this.state.songs.find(t=>t.id===e);i&&this.stateManager.setPlaybackState({currentSong:i,playlistId:r.id,playlistName:r.name,currentIndex:t,totalTracks:this.state.songs.length,hasPrevious:t>0,hasNext:t<this.state.songs.length-1})}attachMoveSongListeners(){let e=this.container.querySelectorAll(`.btn-move-up`),t=this.container.querySelectorAll(`.btn-move-down`);e.forEach(e=>{e.addEventListener(`click`,async t=>{t.stopPropagation();let n=e.dataset.songId,r=parseInt(e.dataset.songIndex||`0`,10);n&&r>0&&await this.moveSong(n,r,r-1)})}),t.forEach(e=>{e.addEventListener(`click`,async t=>{t.stopPropagation();let n=e.dataset.songId,r=parseInt(e.dataset.songIndex||`0`,10);n&&r<this.state.songs.length-1&&await this.moveSong(n,r,r+1)})})}async moveSong(e,t,n){let r=this.stateManager.getState();if(!r.currentPlaylist)return;let i=[...this.state.songs],[a]=i.splice(t,1);i.splice(n,0,a),this.updateState({songs:i});try{await this.playlistApi.moveSong(r.currentPlaylist,e,n),await this.loadSongs(r.currentPlaylist)}catch(e){this.handleError(e,`Failed to reorder song`),await this.loadSongs(r.currentPlaylist)}}handleError(e,t,n){let r=t;e&&typeof e==`object`&&`message`in e&&(r=e.message),n?this.updateState({errors:{...this.state.errors,[n]:r}}):this.updateState({errors:{...this.state.errors,general:r}})}updateState(e){this.state={...this.state,...e},this.render(),this.attachEventListeners()}escapeHtml(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}addStyles(){if(document.getElementById(`playlist-view-styles`))return;let e=document.createElement(`style`);e.id=`playlist-view-styles`,e.textContent=`
      .playlist-view-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }

      .playlist-view-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .playlist-view-title {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
      }

      .playlist-view-content {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 2rem;
      }

      .section-title {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #2d3748;
      }

      .playlists-section,
      .songs-section {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .songs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .playlists-list,
      .songs-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .playlist-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
      }

      .playlist-item:hover {
        background-color: #f7fafc;
      }

      .playlist-item-active {
        background-color: #ebf4ff;
        border-color: #667eea;
      }

      .playlist-info {
        flex: 1;
      }

      .playlist-name {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.25rem;
      }

      .playlist-meta {
        font-size: 0.85rem;
        color: #718096;
      }

      .btn-delete-playlist {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        opacity: 0.6;
        transition: opacity 0.2s;
      }

      .btn-delete-playlist:hover {
        opacity: 1;
      }

      .song-item {
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-radius: 6px;
        background-color: #f7fafc;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .song-item:hover {
        background-color: #edf2f7;
        transform: translateX(4px);
      }

      .song-info {
        flex: 1;
      }

      .song-title {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.25rem;
      }

      .song-artist {
        font-size: 0.9rem;
        color: #718096;
      }

      .song-actions {
        display: flex;
        gap: 0.5rem;
        margin-left: 1rem;
      }

      .btn-move-song {
        background: none;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        transition: all 0.2s;
        opacity: 0.7;
      }

      .btn-move-song:hover:not(:disabled) {
        opacity: 1;
        background-color: #edf2f7;
        border-color: #cbd5e0;
      }

      .btn-move-song:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .loading-message,
      .empty-message {
        text-align: center;
        padding: 2rem;
        color: #718096;
        font-size: 0.95rem;
      }

      .error-message {
        padding: 1rem;
        margin-bottom: 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
      }

      .btn-primary {
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-secondary {
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: #4a5568;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary:hover:not(:disabled) {
        background-color: #f7fafc;
        border-color: #cbd5e0;
      }

      .btn-secondary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-danger {
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: white;
        background: #e53e3e;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-danger:hover {
        background: #c53030;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-small {
        max-width: 400px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #718096;
        padding: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .modal-close:hover {
        background-color: #f7fafc;
        color: #2d3748;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid #e2e8f0;
      }

      .form-group {
        margin-bottom: 1.25rem;
      }

      .form-label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        transition: all 0.2s;
        outline: none;
        box-sizing: border-box;
      }

      .form-input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .form-input:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-error-general {
        padding: 0.75rem 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }

      @media (max-width: 768px) {
        .playlist-view-content {
          grid-template-columns: 1fr;
        }

        .playlist-view-header {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }

        .modal {
          width: 95%;
        }
      }
    `,document.head.appendChild(e)}destroy(){this.unsubscribe&&this.unsubscribe(),this.container.innerHTML=``}},d=class{constructor(e,t){this.container=e,this.stateManager=t,this.audio=new Audio,this.audio.preload=`metadata`,this.state={currentSong:null,isPlaying:!1,currentTime:0,duration:0,volume:.7,isMuted:!1,error:null},this.audio.volume=this.state.volume,this.unsubscribe=this.stateManager.subscribe(e=>{this.handleStateChange(e)}),this.setupAudioListeners(),this.render(),this.attachEventListeners(),this.loadPlaybackState()}handleStateChange(e){if(e.playbackState?.currentSong){let t=e.playbackState.currentSong;(!this.state.currentSong||this.state.currentSong.id!==t.id)&&this.loadSong(t)}}setupAudioListeners(){this.audio.addEventListener(`loadedmetadata`,()=>{this.updateState({duration:this.audio.duration})}),this.audio.addEventListener(`timeupdate`,()=>{this.updateState({currentTime:this.audio.currentTime}),this.savePlaybackState()}),this.audio.addEventListener(`ended`,()=>{this.updateState({isPlaying:!1})}),this.audio.addEventListener(`error`,e=>{console.error(`Audio error:`,e);let t=`Failed to load audio file`;if(this.audio.error)switch(this.audio.error.code){case MediaError.MEDIA_ERR_ABORTED:t=`Audio loading was aborted`;break;case MediaError.MEDIA_ERR_NETWORK:t=`Network error while loading audio`;break;case MediaError.MEDIA_ERR_DECODE:t=`Audio file is corrupted or in an unsupported format`;break;case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:t=`Audio source not supported. The URL may require authentication or have CORS restrictions.`;break}this.updateState({error:t,isPlaying:!1})}),this.audio.addEventListener(`play`,()=>{this.updateState({isPlaying:!0,error:null})}),this.audio.addEventListener(`pause`,()=>{this.updateState({isPlaying:!1})})}loadSong(e){this.audio.pause();let t=e.audioUrl.toLowerCase();if(t.includes(`youtube.com`)||t.includes(`youtu.be`)||t.includes(`soundcloud.com`)||t.includes(`spotify.com`)){this.updateState({currentSong:e,currentTime:0,duration:0,isPlaying:!1,error:`Cannot play external URLs directly. Please use the upload or YouTube extraction feature to add this song.`}),this.render(),this.attachEventListeners();return}this.audio.src=e.audioUrl,this.updateState({currentSong:e,currentTime:0,duration:0,isPlaying:!1,error:null}),this.state.isPlaying&&this.play(),this.render(),this.attachEventListeners()}async play(){try{await this.audio.play(),this.updateState({isPlaying:!0,error:null})}catch(e){console.error(`Play error:`,e),this.updateState({error:`Failed to play audio`,isPlaying:!1})}}pause(){this.audio.pause(),this.updateState({isPlaying:!1})}togglePlayPause(){this.state.isPlaying?this.pause():this.play()}seek(e){this.audio.currentTime=e,this.updateState({currentTime:e})}setVolume(e){this.audio.volume=e,this.updateState({volume:e,isMuted:e===0}),this.savePlaybackState()}toggleMute(){this.state.isMuted?(this.audio.volume=this.state.volume,this.updateState({isMuted:!1})):(this.audio.volume=0,this.updateState({isMuted:!0}))}formatTime(e){return isFinite(e)?`${Math.floor(e/60)}:${Math.floor(e%60).toString().padStart(2,`0`)}`:`0:00`}savePlaybackState(){if(!this.state.currentSong)return;let e={songId:this.state.currentSong.id,currentTime:this.audio.currentTime,volume:this.state.volume};localStorage.setItem(`waveline_playback_state`,JSON.stringify(e))}loadPlaybackState(){try{let e=localStorage.getItem(`waveline_playback_state`);if(!e)return;let t=JSON.parse(e);typeof t.volume==`number`&&this.setVolume(t.volume)}catch(e){console.error(`Failed to load playback state:`,e)}}render(){let{currentSong:e,isPlaying:t,currentTime:n,duration:r,volume:i,isMuted:a,error:o}=this.state,s=r>0?n/r*100:0;this.container.innerHTML=`
      <div class="player-controls-container">
        ${o?`
          <div class="player-error">
            ${this.escapeHtml(o)}
          </div>
        `:``}

        <div class="player-info">
          ${e?`
            <div class="song-info">
              <div class="song-title">${this.escapeHtml(e.title)}</div>
              <div class="song-artist">${this.escapeHtml(e.artist)}</div>
            </div>
          `:`
            <div class="no-song">No song selected</div>
          `}
        </div>

        <div class="player-progress">
          <span class="time-current">${this.formatTime(n)}</span>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${s}%"></div>
              <input
                type="range"
                class="progress-slider"
                min="0"
                max="${r||100}"
                value="${n}"
                step="0.1"
                ${e?``:`disabled`}
              />
            </div>
          </div>
          <span class="time-duration">${this.formatTime(r)}</span>
        </div>

        <div class="player-controls">
          <button
            class="control-btn"
            id="prev-btn"
            title="Previous"
            disabled
          >
            ⏮️
          </button>

          <button
            class="control-btn control-btn-play"
            id="play-pause-btn"
            title="${t?`Pause`:`Play`}"
            ${e?``:`disabled`}
          >
            ${t?`⏸️`:`▶️`}
          </button>

          <button
            class="control-btn"
            id="next-btn"
            title="Next"
            disabled
          >
            ⏭️
          </button>
        </div>

        <div class="player-volume">
          <button
            class="volume-btn"
            id="mute-btn"
            title="${a?`Unmute`:`Mute`}"
          >
            ${a?`🔇`:i>.5?`🔊`:i>0?`🔉`:`🔈`}
          </button>
          <input
            type="range"
            class="volume-slider"
            id="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value="${a?0:i}"
          />
        </div>
      </div>
    `,this.addStyles()}attachEventListeners(){this.container.querySelector(`#play-pause-btn`)?.addEventListener(`click`,()=>{this.togglePlayPause()}),this.container.querySelector(`.progress-slider`)?.addEventListener(`input`,e=>{let t=e.target;this.seek(parseFloat(t.value))}),this.container.querySelector(`#volume-slider`)?.addEventListener(`input`,e=>{let t=e.target;this.setVolume(parseFloat(t.value))}),this.container.querySelector(`#mute-btn`)?.addEventListener(`click`,()=>{this.toggleMute()})}updateState(e){this.state={...this.state,...e},this.render(),this.attachEventListeners()}escapeHtml(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}addStyles(){if(document.getElementById(`player-controls-styles`))return;let e=document.createElement(`style`);e.id=`player-controls-styles`,e.textContent=`
      .player-controls-container {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        max-width: 800px;
        margin: 0 auto;
      }

      .player-error {
        padding: 0.75rem;
        margin-bottom: 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
        font-size: 0.9rem;
      }

      .player-info {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      .song-info .song-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 0.25rem;
      }

      .song-info .song-artist {
        font-size: 1rem;
        color: #718096;
      }

      .no-song {
        font-size: 1rem;
        color: #a0aec0;
        font-style: italic;
      }

      .player-progress {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .time-current,
      .time-duration {
        font-size: 0.85rem;
        color: #718096;
        min-width: 40px;
      }

      .progress-bar-container {
        flex: 1;
      }

      .progress-bar {
        position: relative;
        height: 6px;
        background-color: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        border-radius: 3px;
        transition: width 0.1s linear;
      }

      .progress-slider {
        position: absolute;
        top: 50%;
        left: 0;
        width: 100%;
        height: 20px;
        margin-top: -10px;
        opacity: 0;
        cursor: pointer;
      }

      .progress-slider:disabled {
        cursor: not-allowed;
      }

      .player-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .control-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s;
        opacity: 0.8;
      }

      .control-btn:hover:not(:disabled) {
        opacity: 1;
        background-color: #f7fafc;
      }

      .control-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .control-btn-play {
        font-size: 2rem;
        background-color: #f7fafc;
      }

      .control-btn-play:hover:not(:disabled) {
        background-color: #edf2f7;
        transform: scale(1.1);
      }

      .player-volume {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        justify-content: center;
      }

      .volume-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        opacity: 0.8;
        transition: opacity 0.2s;
      }

      .volume-btn:hover {
        opacity: 1;
      }

      .volume-slider {
        width: 100px;
        height: 4px;
        border-radius: 2px;
        background: #e2e8f0;
        outline: none;
        -webkit-appearance: none;
      }

      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #667eea;
        cursor: pointer;
      }

      .volume-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #667eea;
        cursor: pointer;
        border: none;
      }
    `,document.head.appendChild(e)}destroy(){this.audio.pause(),this.audio.src=``,this.updateInterval&&clearInterval(this.updateInterval),this.unsubscribe&&this.unsubscribe()}},f=class{constructor(e,t,n,r,i){this.isVisible=!1,this.container=e,this.uploadApi=t,this.youtubeApi=n,this.playlistApi=r,this.onSongAdded=i,this.playlistId=``,this.state={activeTab:localStorage.getItem(`uploadModal_lastTab`)||`url`,isProcessing:!1,progress:0,error:null,urlData:{title:``,artist:``,audioUrl:``},selectedFile:null,fileMetadata:null,youtubeUrl:``,youtubePreview:null,isLoadingPreview:!1}}show(e){this.playlistId=e,this.isVisible=!0,this.resetState(),this.render(),this.attachEventListeners()}hide(){this.isVisible=!1,this.render()}setActiveTab(e){this.state.activeTab=e,this.state.error=null,localStorage.setItem(`uploadModal_lastTab`,e),this.render(),this.attachEventListeners()}resetState(){this.state={...this.state,isProcessing:!1,progress:0,error:null,urlData:{title:``,artist:``,audioUrl:``},selectedFile:null,fileMetadata:null,youtubeUrl:``,youtubePreview:null,isLoadingPreview:!1}}render(){if(!this.isVisible){this.container.innerHTML=``;return}this.container.innerHTML=`
      <div class="modal-overlay" id="upload-modal-overlay">
        <div class="modal modal-upload">
          <div class="modal-header">
            <h3 class="modal-title">Add Song</h3>
            <button class="modal-close" id="close-upload-modal">&times;</button>
          </div>
          
          <!-- Tab Navigation -->
          <div class="upload-tabs">
            <button 
              class="upload-tab ${this.state.activeTab===`url`?`upload-tab-active`:``}"
              data-tab="url"
              ${this.state.isProcessing?`disabled`:``}>
              URL
            </button>
            <button 
              class="upload-tab ${this.state.activeTab===`upload`?`upload-tab-active`:``}"
              data-tab="upload"
              ${this.state.isProcessing?`disabled`:``}>
              Upload File
            </button>
            <button 
              class="upload-tab ${this.state.activeTab===`youtube`?`upload-tab-active`:``}"
              data-tab="youtube"
              ${this.state.isProcessing?`disabled`:``}>
              YouTube
            </button>
          </div>

          <div class="modal-body">
            ${this.state.error?`
              <div class="form-error-general">
                ${this.escapeHtml(this.state.error)}
              </div>
            `:``}

            ${this.state.isProcessing?this.renderProgress():``}

            <!-- Tab Content -->
            <div class="upload-tab-content">
              ${this.renderTabContent()}
            </div>
          </div>

          <div class="modal-footer">
            <button 
              class="btn-secondary" 
              id="cancel-upload"
              ${this.state.isProcessing?`disabled`:``}>
              Cancel
            </button>
            <button 
              class="btn-primary" 
              id="submit-upload"
              ${this.state.isProcessing||!this.canSubmit()?`disabled`:``}>
              ${this.getSubmitButtonText()}
            </button>
          </div>
        </div>
      </div>
    `,this.addStyles()}renderProgress(){return`
      <div class="upload-progress">
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${this.state.progress}%"></div>
        </div>
        <div class="progress-text">${this.state.progress}%</div>
      </div>
    `}renderTabContent(){switch(this.state.activeTab){case`url`:return this.renderUrlTab();case`upload`:return this.renderUploadTab();case`youtube`:return this.renderYoutubeTab();default:return``}}renderUrlTab(){return`
      <div class="form-group">
        <label for="song-title" class="form-label">Title</label>
        <input
          type="text"
          id="song-title"
          class="form-input"
          value="${this.escapeHtml(this.state.urlData.title)}"
          placeholder="Enter song title"
          ${this.state.isProcessing?`disabled`:``}
        />
      </div>
      <div class="form-group">
        <label for="song-artist" class="form-label">Artist</label>
        <input
          type="text"
          id="song-artist"
          class="form-input"
          value="${this.escapeHtml(this.state.urlData.artist)}"
          placeholder="Enter artist name"
          ${this.state.isProcessing?`disabled`:``}
        />
      </div>
      <div class="form-group">
        <label for="song-url" class="form-label">Audio URL</label>
        <input
          type="url"
          id="song-url"
          class="form-input"
          value="${this.escapeHtml(this.state.urlData.audioUrl)}"
          placeholder="https://example.com/song.mp3"
          ${this.state.isProcessing?`disabled`:``}
        />
      </div>
    `}renderUploadTab(){return`
      <div class="file-upload-area">
        ${this.state.selectedFile?`
          <div class="file-selected">
            <div class="file-icon">🎵</div>
            <div class="file-info">
              <div class="file-name">${this.escapeHtml(this.state.fileMetadata?.name||``)}</div>
              <div class="file-meta">
                ${this.formatFileSize(this.state.fileMetadata?.size||0)} • 
                ${this.escapeHtml(this.state.fileMetadata?.format||``)}
              </div>
            </div>
            <button class="btn-clear-file" id="clear-file" ${this.state.isProcessing?`disabled`:``}>
              &times;
            </button>
          </div>
        `:`
          <div class="file-drop-zone" id="file-drop-zone">
            <div class="drop-zone-content">
              <div class="drop-zone-icon">📁</div>
              <div class="drop-zone-text">
                Drag and drop an audio file here
              </div>
              <div class="drop-zone-or">or</div>
              <label for="file-input" class="btn-secondary btn-file-picker">
                Choose File
              </label>
              <input
                type="file"
                id="file-input"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/flac,.mp3,.wav,.ogg,.m4a,.flac"
                style="display: none;"
                ${this.state.isProcessing?`disabled`:``}
              />
              <div class="drop-zone-hint">
                Supported formats: MP3, WAV, OGG, M4A, FLAC (max 50MB)
              </div>
            </div>
          </div>
        `}
      </div>
    `}renderYoutubeTab(){return`
      <div class="form-group">
        <label for="youtube-url" class="form-label">YouTube URL</label>
        <input
          type="url"
          id="youtube-url"
          class="form-input"
          value="${this.escapeHtml(this.state.youtubeUrl)}"
          placeholder="https://www.youtube.com/watch?v=..."
          ${this.state.isProcessing?`disabled`:``}
        />
      </div>

      ${this.state.isLoadingPreview?`
        <div class="youtube-preview-loading">
          Loading preview...
        </div>
      `:``}

      ${this.state.youtubePreview?`
        <div class="youtube-preview">
          <img 
            src="${this.escapeHtml(this.state.youtubePreview.thumbnail)}" 
            alt="Video thumbnail"
            class="youtube-thumbnail"
          />
          <div class="youtube-info">
            <div class="youtube-title">${this.escapeHtml(this.state.youtubePreview.title)}</div>
            <div class="youtube-duration">${this.formatDuration(this.state.youtubePreview.duration)}</div>
          </div>
        </div>
      `:``}
    `}canSubmit(){if(this.state.isProcessing)return!1;switch(this.state.activeTab){case`url`:return!!(this.state.urlData.title.trim()&&this.state.urlData.artist.trim()&&this.state.urlData.audioUrl.trim());case`upload`:return!!this.state.selectedFile;case`youtube`:return!!this.state.youtubePreview;default:return!1}}getSubmitButtonText(){if(this.state.isProcessing)switch(this.state.activeTab){case`upload`:return`Uploading...`;case`youtube`:return`Extracting...`;default:return`Processing...`}return`Add Song`}attachEventListeners(){this.container.querySelector(`#close-upload-modal`)?.addEventListener(`click`,()=>this.hide());let e=this.container.querySelector(`#upload-modal-overlay`);e?.addEventListener(`click`,t=>{t.target===e&&this.hide()}),this.container.querySelector(`#cancel-upload`)?.addEventListener(`click`,()=>this.hide()),this.container.querySelector(`#submit-upload`)?.addEventListener(`click`,()=>this.handleSubmit()),this.container.querySelectorAll(`.upload-tab`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tab;this.setActiveTab(t)})}),this.attachTabListeners()}attachTabListeners(){switch(this.state.activeTab){case`url`:this.attachUrlTabListeners();break;case`upload`:this.attachUploadTabListeners();break;case`youtube`:this.attachYoutubeTabListeners();break}}attachUrlTabListeners(){let e=this.container.querySelector(`#song-title`),t=this.container.querySelector(`#song-artist`),n=this.container.querySelector(`#song-url`);e?.addEventListener(`input`,()=>{this.state.urlData.title=e.value,this.updateSubmitButton()}),t?.addEventListener(`input`,()=>{this.state.urlData.artist=t.value,this.updateSubmitButton()}),n?.addEventListener(`input`,()=>{this.state.urlData.audioUrl=n.value,this.updateSubmitButton()})}attachUploadTabListeners(){let e=this.container.querySelector(`#file-input`),t=this.container.querySelector(`#file-drop-zone`),n=this.container.querySelector(`#clear-file`);e?.addEventListener(`change`,e=>{let t=e.target.files?.[0];t&&this.handleFileSelect(t)}),n?.addEventListener(`click`,()=>{this.state.selectedFile=null,this.state.fileMetadata=null,this.render(),this.attachEventListeners()}),t?.addEventListener(`dragover`,e=>{e.preventDefault(),t.classList.add(`drop-zone-active`)}),t?.addEventListener(`dragleave`,()=>{t.classList.remove(`drop-zone-active`)}),t?.addEventListener(`drop`,e=>{e.preventDefault(),t.classList.remove(`drop-zone-active`);let n=e.dataTransfer?.files[0];n&&this.handleFileSelect(n)})}attachYoutubeTabListeners(){let e=this.container.querySelector(`#youtube-url`),t;e?.addEventListener(`input`,()=>{this.state.youtubeUrl=e.value,this.state.youtubePreview=null,clearTimeout(t),this.state.youtubeUrl.trim()?t=window.setTimeout(()=>{this.loadYoutubePreview()},800):this.updateSubmitButton()})}handleFileSelect(e){let t=this.validateFile(e);if(!t.isValid){this.state.error=t.error||`Invalid file`,this.render(),this.attachEventListeners();return}this.state.selectedFile=e,this.state.fileMetadata={name:e.name,size:e.size,format:e.name.split(`.`).pop()?.toUpperCase()||`UNKNOWN`},this.state.error=null,this.render(),this.attachEventListeners()}validateFile(e){return[`audio/mpeg`,`audio/wav`,`audio/ogg`,`audio/mp4`,`audio/flac`].includes(e.type)?e.size>52428800?{isValid:!1,error:`File size exceeds 50MB limit`}:{isValid:!0}:{isValid:!1,error:`Invalid file type. Supported formats: MP3, WAV, OGG, M4A, FLAC`}}async loadYoutubePreview(){if(this.state.youtubeUrl.trim()){this.state.isLoadingPreview=!0,this.state.error=null,this.render(),this.attachEventListeners();try{let e=await this.youtubeApi.getPreview({url:this.state.youtubeUrl});if(!e.isAvailable)throw Error(`Video is not available`);this.state.youtubePreview=e,this.state.isLoadingPreview=!1,this.render(),this.attachEventListeners()}catch(e){this.state.isLoadingPreview=!1,this.state.error=e instanceof Error?e.message:`Failed to load video preview`,this.render(),this.attachEventListeners()}}}async handleSubmit(){if(this.canSubmit()){this.state.isProcessing=!0,this.state.progress=0,this.state.error=null,this.render(),this.attachEventListeners();try{let e;switch(this.state.activeTab){case`url`:e=await this.submitUrl();break;case`upload`:e=await this.submitUpload();break;case`youtube`:e=await this.submitYoutube();break;default:throw Error(`Invalid tab`)}this.onSongAdded(e),this.hide()}catch(e){this.state.isProcessing=!1,this.state.error=e instanceof Error?e.message:`Operation failed`,this.render(),this.attachEventListeners()}}}async submitUrl(){return await this.playlistApi.addSong(this.playlistId,{title:this.state.urlData.title.trim(),artist:this.state.urlData.artist.trim(),audioUrl:this.state.urlData.audioUrl.trim()})}async submitUpload(){if(!this.state.selectedFile)throw Error(`No file selected`);return(await this.uploadApi.uploadFile({file:this.state.selectedFile,playlistId:this.playlistId,onProgress:e=>{this.state.progress=e,this.updateProgress()}})).song}async submitYoutube(){return(await this.youtubeApi.extractAudio({url:this.state.youtubeUrl,playlistId:this.playlistId},e=>{this.state.progress=e,this.updateProgress()})).song}updateProgress(){let e=this.container.querySelector(`.progress-bar`),t=this.container.querySelector(`.progress-text`);e&&(e.style.width=`${this.state.progress}%`),t&&(t.textContent=`${this.state.progress}%`)}updateSubmitButton(){let e=this.container.querySelector(`#submit-upload`);e&&(e.disabled=!this.canSubmit())}formatFileSize(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}formatDuration(e){return`${Math.floor(e/60)}:${(e%60).toString().padStart(2,`0`)}`}escapeHtml(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}addStyles(){if(document.getElementById(`upload-modal-styles`))return;let e=document.createElement(`style`);e.id=`upload-modal-styles`,e.textContent=`
      .modal-upload {
        max-width: 600px;
      }

      .upload-tabs {
        display: flex;
        border-bottom: 2px solid #e2e8f0;
      }

      .upload-tab {
        flex: 1;
        padding: 1rem;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        font-size: 0.95rem;
        font-weight: 600;
        color: #718096;
        cursor: pointer;
        transition: all 0.2s;
      }

      .upload-tab:hover:not(:disabled) {
        color: #4a5568;
        background-color: #f7fafc;
      }

      .upload-tab:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .upload-tab-active {
        color: #667eea;
        border-bottom-color: #667eea;
      }

      .upload-tab-content {
        margin-top: 1rem;
      }

      .upload-progress {
        margin-bottom: 1.5rem;
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background-color: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
      }

      .progress-text {
        text-align: center;
        font-size: 0.9rem;
        color: #4a5568;
        font-weight: 600;
      }

      .file-upload-area {
        min-height: 200px;
      }

      .file-drop-zone {
        border: 2px dashed #cbd5e0;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
      }

      .file-drop-zone:hover {
        border-color: #667eea;
        background-color: #f7fafc;
      }

      .file-drop-zone.drop-zone-active {
        border-color: #667eea;
        background-color: #ebf4ff;
      }

      .drop-zone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .drop-zone-icon {
        font-size: 3rem;
      }

      .drop-zone-text {
        font-size: 1rem;
        color: #4a5568;
        font-weight: 500;
      }

      .drop-zone-or {
        color: #a0aec0;
        font-size: 0.9rem;
      }

      .btn-file-picker {
        display: inline-block;
        cursor: pointer;
      }

      .drop-zone-hint {
        font-size: 0.85rem;
        color: #a0aec0;
      }

      .file-selected {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background-color: #f7fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
      }

      .file-icon {
        font-size: 2.5rem;
      }

      .file-info {
        flex: 1;
      }

      .file-name {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.25rem;
      }

      .file-meta {
        font-size: 0.85rem;
        color: #718096;
      }

      .btn-clear-file {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #718096;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .btn-clear-file:hover:not(:disabled) {
        background-color: #e2e8f0;
        color: #2d3748;
      }

      .youtube-preview-loading {
        text-align: center;
        padding: 2rem;
        color: #718096;
      }

      .youtube-preview {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background-color: #f7fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        margin-top: 1rem;
      }

      .youtube-thumbnail {
        width: 120px;
        height: 90px;
        object-fit: cover;
        border-radius: 6px;
      }

      .youtube-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .youtube-title {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
      }

      .youtube-duration {
        font-size: 0.85rem;
        color: #718096;
      }
    `,document.head.appendChild(e)}},p=class{constructor(e,t){this.quota=null,this.isLoading=!1,this.error=null,this.container=e,this.uploadApi=t}async load(){this.isLoading=!0,this.error=null,this.render();try{this.quota=await this.uploadApi.getStorageQuota(),this.isLoading=!1,this.render()}catch(e){this.isLoading=!1,this.error=e instanceof Error?e.message:`Failed to load storage quota`,this.render()}}async refresh(){await this.load()}render(){if(this.isLoading){this.container.innerHTML=`
        <div class="storage-quota-loading">
          Loading storage info...
        </div>
      `,this.addStyles();return}if(this.error){this.container.innerHTML=`
        <div class="storage-quota-error">
          ${this.escapeHtml(this.error)}
        </div>
      `,this.addStyles();return}if(!this.quota){this.container.innerHTML=``;return}let e=this.quota.percentage>=80,t=e?`storage-quota-warning`:``;this.container.innerHTML=`
      <div class="storage-quota ${t}">
        <div class="storage-quota-header">
          <span class="storage-quota-icon">💾</span>
          <span class="storage-quota-title">Storage</span>
        </div>
        
        <div class="storage-quota-bar-container">
          <div 
            class="storage-quota-bar ${e?`storage-quota-bar-warning`:``}" 
            style="width: ${this.quota.percentage}%"
          ></div>
        </div>
        
        <div class="storage-quota-info">
          <span class="storage-quota-used">
            ${this.formatBytes(this.quota.used)} / ${this.formatBytes(this.quota.limit)}
          </span>
          <span class="storage-quota-percentage">
            ${this.quota.percentage.toFixed(1)}%
          </span>
        </div>

        ${e?`
          <div class="storage-quota-warning-message">
            ⚠️ Storage usage is high. Consider deleting unused files.
          </div>
        `:``}
      </div>
    `,this.addStyles()}formatBytes(e){if(e===0)return`0 B`;let t=1024,n=[`B`,`KB`,`MB`,`GB`],r=Math.floor(Math.log(e)/Math.log(t));return`${(e/t**+r).toFixed(1)} ${n[r]}`}escapeHtml(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}addStyles(){if(document.getElementById(`storage-quota-styles`))return;let e=document.createElement(`style`);e.id=`storage-quota-styles`,e.textContent=`
      .storage-quota {
        padding: 1rem;
        background-color: #f7fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .storage-quota-warning {
        border-color: #f6ad55;
        background-color: #fffaf0;
      }

      .storage-quota-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .storage-quota-icon {
        font-size: 1.25rem;
      }

      .storage-quota-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: #4a5568;
      }

      .storage-quota-bar-container {
        width: 100%;
        height: 8px;
        background-color: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .storage-quota-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
        border-radius: 4px;
      }

      .storage-quota-bar-warning {
        background: linear-gradient(90deg, #f6ad55 0%, #ed8936 100%);
      }

      .storage-quota-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
      }

      .storage-quota-used {
        color: #4a5568;
      }

      .storage-quota-percentage {
        font-weight: 600;
        color: #2d3748;
      }

      .storage-quota-warning-message {
        margin-top: 0.75rem;
        padding: 0.5rem;
        background-color: #fef5e7;
        border: 1px solid #f6ad55;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #744210;
      }

      .storage-quota-loading,
      .storage-quota-error {
        padding: 1rem;
        text-align: center;
        font-size: 0.9rem;
        color: #718096;
      }

      .storage-quota-error {
        color: #e53e3e;
      }
    `,document.head.appendChild(e)}},m=class{static{this.container=null}static{this.isInitialized=!1}static init(){this.isInitialized||=(this.container=document.createElement(`div`),this.container.className=`toast-container`,document.body.appendChild(this.container),this.addStyles(),!0)}static show(e,t=`info`,n=5e3){if(!this.container){console.warn(`Toast not initialized. Call Toast.init() first.`);return}let r=document.createElement(`div`);r.className=`toast toast-${t}`;let i=document.createElement(`span`);i.className=`toast-message`,i.textContent=e;let a=document.createElement(`button`);a.className=`toast-close`,a.innerHTML=`&times;`,a.setAttribute(`aria-label`,`Close notification`),r.appendChild(i),r.appendChild(a),this.container.appendChild(r),setTimeout(()=>r.classList.add(`show`),10);let o=()=>{r.classList.remove(`show`),setTimeout(()=>{r.parentNode&&r.remove()},300)};a.addEventListener(`click`,o),r.addEventListener(`click`,o),n>0&&setTimeout(o,n)}static error(e){this.show(e,`error`)}static success(e){this.show(e,`success`)}static warning(e){this.show(e,`warning`)}static info(e){this.show(e,`info`)}static addStyles(){if(document.getElementById(`toast-styles`))return;let e=document.createElement(`style`);e.id=`toast-styles`,e.textContent=`
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }

      .toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 500px;
        padding: 16px 20px;
        background-color: #333;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        cursor: pointer;
        font-size: 14px;
        line-height: 1.5;
      }

      .toast.show {
        opacity: 1;
        transform: translateX(0);
      }

      .toast-message {
        flex: 1;
        margin-right: 12px;
        word-wrap: break-word;
      }

      .toast-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }

      .toast-close:hover {
        opacity: 1;
      }

      /* Toast type styles */
      .toast-success {
        background-color: #4caf50;
        border-left: 4px solid #2e7d32;
      }

      .toast-error {
        background-color: #f44336;
        border-left: 4px solid #c62828;
      }

      .toast-warning {
        background-color: #ff9800;
        border-left: 4px solid #e65100;
      }

      .toast-info {
        background-color: #2196f3;
        border-left: 4px solid #1565c0;
      }

      /* Responsive design */
      @media (max-width: 600px) {
        .toast-container {
          top: 10px;
          right: 10px;
          left: 10px;
        }

        .toast {
          min-width: auto;
          max-width: none;
          width: 100%;
        }
      }

      /* Animation for stacking multiple toasts */
      .toast:not(.show) {
        margin-bottom: -100px;
      }
    `,document.head.appendChild(e)}static clearAll(){this.container&&(this.container.innerHTML=``)}static destroy(){this.container&&this.container.parentNode&&this.container.remove(),this.container=null,this.isInitialized=!1;let e=document.getElementById(`toast-styles`);e&&e.remove()}},h=class{constructor(e){this.errorInfo=null,this.container=e,this.setupGlobalErrorHandler()}setupGlobalErrorHandler(){window.addEventListener(`error`,e=>{this.handleError(e.error||Error(e.message)),e.preventDefault()}),window.addEventListener(`unhandledrejection`,e=>{let t=e.reason instanceof Error?e.reason:Error(String(e.reason));this.handleError(t),e.preventDefault()})}handleError(e){this.errorInfo={message:e.message||`An unexpected error occurred`,stack:e.stack,timestamp:new Date},console.error(`Error caught by boundary:`,e),console.error(`Timestamp:`,this.errorInfo.timestamp.toISOString()),this.errorInfo.stack&&console.error(`Stack trace:`,this.errorInfo.stack),this.render(),this.reportError(e)}render(){if(!this.errorInfo)return;this.container.innerHTML=`
      <div class="error-boundary">
        <div class="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p class="error-message">${this.escapeHtml(this.errorInfo.message)}</p>
        <button id="reload-btn" class="reload-button">Reload Application</button>
        
      </div>
    `,this.addStyles();let e=document.getElementById(`reload-btn`);e&&e.addEventListener(`click`,()=>{window.location.reload()})}addStyles(){if(document.getElementById(`error-boundary-styles`))return;let e=document.createElement(`style`);e.id=`error-boundary-styles`,e.textContent=`
      .error-boundary {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 2rem;
        text-align: center;
        background-color: #fff;
        border: 2px solid #f44336;
        border-radius: 8px;
        margin: 2rem auto;
        max-width: 600px;
      }

      .error-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .error-boundary h2 {
        color: #f44336;
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
      }

      .error-message {
        color: #333;
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
        line-height: 1.5;
      }

      .reload-button {
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .reload-button:hover {
        background-color: #1976D2;
      }

      .reload-button:active {
        background-color: #0D47A1;
      }

      .error-details {
        margin-top: 2rem;
        width: 100%;
        text-align: left;
      }

      .error-details summary {
        cursor: pointer;
        color: #666;
        font-weight: bold;
        padding: 0.5rem;
        background-color: #f5f5f5;
        border-radius: 4px;
        user-select: none;
      }

      .error-details summary:hover {
        background-color: #e0e0e0;
      }

      .error-stack {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .error-stack pre {
        margin: 0.5rem 0 0 0;
        padding: 0.5rem;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.75rem;
        line-height: 1.4;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    `,document.head.appendChild(e)}reportError(e){try{window.errorTracker&&typeof window.errorTracker.captureException==`function`&&(window.errorTracker.captureException(e),console.log(`Error reported to tracking service`))}catch(e){console.warn(`Failed to report error to tracking service:`,e)}}escapeHtml(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}reset(){this.errorInfo=null,this.container.innerHTML=``}},g=document.getElementById(`app`);if(!g)throw Error(`App container not found`);var _=new s,v=new n(_),y=new r(_),b=new i(_),x=new a(_),S=new e,C=new t;new h(g),m.init();var w=null,T=null,E=null,D=null;function O(){g.innerHTML=`
    <div class="auth-container">
      <div class="auth-header">
        <h1>🎵 Waveline Music Player</h1>
        <p>Your personal music collection</p>
      </div>
      
      <div class="auth-tabs">
        <button id="tab-login" class="auth-tab active">Login</button>
        <button id="tab-register" class="auth-tab">Register</button>
      </div>
      
      <div id="auth-content" class="auth-content"></div>
    </div>
  `;let e=document.getElementById(`tab-login`),t=document.getElementById(`tab-register`),n=document.getElementById(`auth-content`),r=null;function i(){e.classList.add(`active`),t.classList.remove(`active`),r&&r.destroy(),r=new c(n,v,S,C,A)}function a(){t.classList.add(`active`),e.classList.remove(`active`),r&&r.destroy(),r=new l(n,v,S,C,A)}e.addEventListener(`click`,i),t.addEventListener(`click`,a),i()}function k(){g.innerHTML=`
    <div class="main-container">
      <header class="app-header">
        <h1>🎵 Waveline Music Player</h1>
        <div class="user-info">
          <span id="username"></span>
          <button id="logout-btn" class="btn-secondary">Logout</button>
        </div>
      </header>
      
      <main class="app-main">
        <div id="storage-quota-container"></div>
        <div id="playlist-view-container"></div>
        <div id="player-controls-container"></div>
        <div id="upload-modal-container"></div>
      </main>
    </div>
  `;let e=C.getState().user,t=document.getElementById(`username`);t&&e&&(t.textContent=e.username);let n=document.getElementById(`logout-btn`);n&&n.addEventListener(`click`,j);let r=document.getElementById(`storage-quota-container`);r&&(D=new p(r,b),setTimeout(()=>{D&&D.load().catch(e=>{console.warn(`Storage quota not available:`,e),r.style.display=`none`})},500));let i=document.getElementById(`upload-modal-container`);i&&(E=new f(i,b,x,y,e=>{if(m.success(`Added "${e.title}" to playlist`),w){let e=C.getState();e.currentPlaylist&&C.setCurrentPlaylist(e.currentPlaylist)}D&&D.refresh()}));let a=document.getElementById(`playlist-view-container`);a&&(w=new u(a,y,C),a.addEventListener(`click`,e=>{let t=e.target;if(t.id===`add-song-btn`||t.closest(`#add-song-btn`)){e.preventDefault(),e.stopPropagation();let t=C.getState();t.currentPlaylist&&E&&E.show(t.currentPlaylist)}}));let o=document.getElementById(`player-controls-container`);o&&(T=new d(o,C))}function A(){let e=S.loadSession();e&&_.setAuthToken(e.token),m.success(`Login successful!`),k()}async function j(){try{w&&=(w.destroy(),null),T&&=(T.destroy(),null),E&&=null,D&&=null,await v.logout(),S.clearSession(),C.clearUser(),_.clearAuthToken(),m.success(`Logged out successfully`),O()}catch(e){S.clearSession(),C.clearUser(),_.clearAuthToken(),m.success(`Logged out successfully`),O(),console.error(`Logout error:`,e)}}async function M(){try{let e=S.loadSession();if(e&&S.isSessionValid()){_.setAuthToken(e.token);try{let e=await v.getCurrentUser();C.setUser(e),k();return}catch{S.clearSession(),C.clearUser(),_.clearAuthToken()}}O()}catch(e){console.error(`Initialization error:`,e),m.error(`Failed to initialize application`),O()}}window.addEventListener(`auth:expired`,()=>{S.clearSession(),C.clearUser(),_.clearAuthToken(),m.error(`Session expired. Please login again.`),O()}),M();