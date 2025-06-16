'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

import {
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Checkbox,
  Button,
  FormControlLabel,
  Divider,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
  Alert
} from '@mui/material'

import { signIn } from 'next-auth/react'
import classnames from 'classnames'
import _ from 'lodash'

import Logo from '@components/layout/shared/Logo'
import themeConfig from '@configs/themeConfig'
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { getLocalizedUrl } from '@/utils/i18n'

const validationSchema = Yup.object().shape({
  email: Yup.string().required('Este campo é obrigatório'),
  password: Yup.string().min(6, 'A senha deve ter pelo menos 6 caracteres').required('Este campo é obrigatório'),
  companyBusinessId: Yup.string(),
  companyId: Yup.string()
})

const Login = ({ mode }) => {

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState(null)
  const [companyBusinesses, setCompanyBusinesses] = useState([])
  const [companies, setCompanies] = useState([])
  const [rememberMe, setRememberMe] = useState(true)
  const [initialEmail, setInitialEmail] = useState('')

  const passwordRef = useRef(null)
  const { settings } = useSettings()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()

  const darkImg = '/images/pages/auth-v2-mask-1-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-1-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setInitialEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleClickShowPassword = () => setIsPasswordShown(prev => !prev)

  const handleLogin = async (values, { setSubmitting, setFieldValue }) => {
    try {
      setErrorState(null)

      const res = await signIn('credentials', {
        email: values.email.trim(),
        password: values.password,
        companyBusinessId: values.companyBusinessId,
        companyId: values.companyId,
        redirect: false
      })

      if (res?.error) {
        let error
        try {
          error = JSON.parse(res.error)
        } catch {
          error = { status: 500, message: res.error }
        }

        switch (error.status) {
          case 201:
            setErrorState(error.message)
            break
          case 202:
            setCompanyBusinesses(error.companyBusinesses || [])
            setCompanies(error.companies || [])
            setFieldValue('companyBusinessId', error.companyBusinessId)
            break
          default:
            setErrorState(error.message || 'Erro desconhecido')
        }

        setSubmitting(false)
        return
      }

      if (res.ok && !res.error) {
        if (values.rememberMe) {
          localStorage.setItem('rememberedEmail', values.email.trim())
        } else {
          localStorage.removeItem('rememberedEmail')
        }

        const redirectURL = searchParams.get('redirectTo') ?? '/'
        router.replace(getLocalizedUrl(redirectURL, locale))
      }

      setSubmitting(false)
    } catch (error) {
      console.error('Erro ao logar:', error)
      setErrorState('Erro inesperado ao tentar fazer login.')
      setSubmitting(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames('flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden', {
          'border-ie': settings.skin === 'bordered'
        })}
      >
        <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
          <img src={characterIllustration} alt='character-illustration' className='max-bs-[673px] max-is-full bs-auto' />
        </div>
        <img src={authBackground} className='absolute bottom-[4%] z-[-1] is-full max-md:hidden' />
      </div>

      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>

        <Formik
          initialValues={{
            email: initialEmail,
            password: '',
            companyBusinessId: '',
            companyId: '',
            rememberMe: rememberMe
          }}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={handleLogin}
        >
          {({ isSubmitting, values, handleChange, errors, touched, submitForm, setFieldValue }) => {
            useEffect(() => {
              if (values.companyBusinessId || values.companyId) {
                submitForm()
              }
            }, [values.companyBusinessId, values.companyId])

            return (
              <Form className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset]'>
                {_.size(companyBusinesses) === 0 && _.size(companies) === 0 ? (
                  <>
                    <div>
                      <Typography variant='h4'>{`Bem-vindo ao ${themeConfig.templateName}! 👋🏻`}</Typography>
                      <br />
                      <Typography>Por favor, faça login na sua conta</Typography>
                    </div>

                    {errorState && <Alert severity='warning'>{errorState}</Alert>}

                    <Field
                      as={TextField}
                      size='small'
                      name='email'
                      label='Usuário'
                      variant='filled'
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      autoFocus={!initialEmail}
                      onChange={e => {
                        handleChange(e)
                        setErrorState(null)
                      }}
                      helperText={<ErrorMessage name='email' />}
                      error={!!errorState || (touched.email && Boolean(errors.email))}
                      disabled={isSubmitting}
                    />

                    <Field
                      as={TextField}
                      size='small'
                      name='password'
                      label='Password'
                      variant='filled'
                      InputLabelProps={{ shrink: true }}
                      type={isPasswordShown ? 'text' : 'password'}
                      fullWidth
                      onChange={e => {
                        handleChange(e)
                        setErrorState(null)
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton onClick={handleClickShowPassword} edge='end'>
                              <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      helperText={<ErrorMessage name='password' />}
                      error={!!errorState || (touched.password && Boolean(errors.password))}
                      disabled={isSubmitting}
                      inputRef={passwordRef}
                    />

                    <div className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1'>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={values.rememberMe}
                            onChange={e => setFieldValue('rememberMe', e.target.checked)}
                            disabled={isSubmitting}
                          />
                        }
                        label='Lembrar'
                      />
                      <Typography component={Link} href={getLocalizedUrl('/forgot-password', locale)} color='primary.main'>
                        Esqueceu sua senha ?
                      </Typography>
                    </div>

                    <Button type='submit' fullWidth variant='contained' disabled={isSubmitting}>
                      {isSubmitting ? `Entrando...` : `Entrar`}
                    </Button>

                    <div className='flex justify-center items-center flex-wrap gap-2'>
                      <Typography>Ainda não possui uma conta ?</Typography>
                      <Typography component={Link} href={getLocalizedUrl('/register', locale)} color='primary.main'>
                        Cadastre-se
                      </Typography>
                    </div>

                    <Divider className='gap-3'>ou</Divider>

                    <Button
                      color='secondary'
                      className='self-center text-textPrimary'
                      startIcon={<img src='/images/logos/google.png' alt='Google' width={22} />}
                      sx={{ '& .MuiButton-startIcon': { marginInlineEnd: 3 } }}
                      onClick={() => signIn('google')}
                      disabled={isSubmitting}
                    >
                      Entrar com Google
                    </Button>
                  </>
                ) : (
                  <>
                    <IconButton
                      onClick={() => {
                        setCompanyBusinesses([])
                        setCompanies([])
                        setErrorState(null)
                        setFieldValue('companyBusinessId', '')
                        setFieldValue('companyId', '')
                      }}
                      disabled={isSubmitting}
                      sx={{ alignSelf: 'flex-start', padding: 0 }}
                    >
                      <i className='ri-arrow-left-line' />
                    </IconButton>
                    
                    <div className='flex items-center gap-2'>
                      <div>
                        <Typography variant='h4'>Próximo passo! 👇🏻</Typography>
                        <Typography>Informe a empresa</Typography>
                      </div>
                    </div>

                    {errorState && <Alert severity='warning'>{errorState}</Alert>}

                    <Field name='companyBusinessId'>
                      {({ field, meta }) => (
                        <FormControl fullWidth variant='filled'>
                          <InputLabel id='companyBusiness-label'>Empresa</InputLabel>
                          <Select
                            size='small'
                            labelId='companyBusiness-label'
                            {...field}
                            error={meta.touched && Boolean(meta.error)}
                            disabled={_.size(companyBusinesses) === 1 || isSubmitting}
                          >
                            {companyBusinesses.map((c, index) => (
                              <MenuItem key={index} value={c.codigo_empresa}>
                                {c.description}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Field>

                    <Field name='companyId'>
                      {({ field, meta }) => (
                        <FormControl fullWidth variant='filled'>
                          <InputLabel id='company-label'>Filial</InputLabel>
                          <Select
                            size='small'
                            labelId='company-label'
                            {...field}
                            error={meta.touched && Boolean(meta.error)}
                            disabled={!values.companyBusinessId || isSubmitting}
                          >
                            {companies.map((c, index) => (
                              <MenuItem key={index} value={c.codigo_empresa_filial}>
                                {c.surname}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Field>

                    <Button type='submit' fullWidth variant='contained' disabled={isSubmitting}>
                      {isSubmitting ? `Aguarde...` : `Continuar`}
                    </Button>
                  </>
                )}
              </Form>
            )
          }}
        </Formik>
      </div>
    </div>
  )
}

export default Login