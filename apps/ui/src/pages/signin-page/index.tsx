import signinBG from "@/assets/images/signin-bg.png";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SigninPage() {
  const { t } = useTranslation();
  const isInitialized = false;

  return (
    <>
      <div className="flex min-h-full">
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
                {isInitialized
                  ? t("signinMediaGoServer")
                  : t("initializeMediaGoServer")}
              </h2>
            </div>

            <div className="mt-10">
              <div>
                <form action="#" method="POST" className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
                    >
                      {isInitialized
                        ? t("adminPassword")
                        : t("settingUpAdminPassword")}
                    </label>
                    <div className="mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-blue-500"
                      />
                    </div>
                  </div>

                  {!isInitialized && (
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
                      >
                        {t("reppeatPassword")}
                      </label>
                      <div className="mt-2">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {isInitialized && (
                    <div className="flex items-center justify-end">
                      <div className="text-sm/6">
                        <Dialog>
                          <DialogTrigger asChild>
                            <a>{t("forgotPassword")}</a>
                          </DialogTrigger>
                          <DialogContent className="w-sm">
                            <DialogHeader>
                              <DialogTitle>{t("forgotPassword")}</DialogTitle>
                            </DialogHeader>
                            <div className="text-gray-600 text-sm">
                              {t("forgetPasswordDescription")}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:shadow-none dark:hover:bg-blue-400 dark:focus-visible:outline-blue-500"
                    >
                      {isInitialized ? t("signin") : t("setup")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="relative hidden w-0 flex-1 lg:block">
          <img
            alt=""
            src={signinBG}
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>
    </>
  );
}
