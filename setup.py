from setuptools import setup

setup(
	name='moo',
	version='0.1.2',
	description="Yet another markdown preview server.",
	long_description=__doc__,
    author="metaphysiks",
    author_email="i@dingstyle.me",
    keywords=("markdown", "pygments", "preview", "flask"),
    url = "https://github.com/metaphysiks/moo",
	packages=['moo'],
	include_package_data=True,
	install_requires=['Flask', 'pygments', 'misaka'],
	zip_safe=False,
	entry_points={
        'console_scripts': ['moo = moo:run_server'],
    },
    classifiers=["Topic :: Utilities"],
)