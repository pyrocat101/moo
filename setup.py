from setuptools import setup
from glob import glob

setup(
	name='moo',
	version='0.1.1',
	description="yet another markdown preview server.",
	long_description="""Moo is a mini markdown render server that provides \
preview of markdown files. It can automatically reload the preview in your \
broswer when the monitored file changes, which makes it suitable to live \
preview markdown in editors that does not provide this feature. Plugins \
can be easily written to interface with it.
""",
    author="metaphysiks",
    author_email="i@dingstyle.me",
    keywords=("markdown", "pygments", "preview", "flask"),
	py_modules=['moo'],
	install_requires=['Flask', 'pygments', 'misaka'],
	zip_safe=False,
	data_files=[('static', glob('static/*')),
                ('templates', glob('templates/*'))],
	entry_points={
        'console_scripts': ['moo = moo:main'],
    }
)